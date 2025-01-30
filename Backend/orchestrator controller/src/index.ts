import express from "express";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import cors from "cors";
import { KubeConfig, AppsV1Api, CoreV1Api, NetworkingV1Api } from "@kubernetes/client-node";


const app = express();
app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:5173', // Allow the frontend origin
    credentials: true,               // Allow credentials (cookies, auth headers, etc.)
};

app.use(cors(corsOptions));

const kubeconfig = new KubeConfig();
kubeconfig.loadFromDefault();
const coreV1Api = kubeconfig.makeApiClient(CoreV1Api);
const appsV1Api = kubeconfig.makeApiClient(AppsV1Api);
const networkingV1Api = kubeconfig.makeApiClient(NetworkingV1Api);

// Updated utility function to handle multi-document YAML files
const readAndParseKubeYaml = (filePath: string, username: string, replId: string): Array<any> => {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const docs = yaml.parseAllDocuments(fileContent).map((doc) => {
        let docString = doc.toString();
        docString = docString.replace(/service_name/g, `${username}-${replId}`);
        docString = docString.replace(/\${USERNAME}/g, username);
        docString = docString.replace(/\${REPLID}/g, replId);
        // console.log(docString); // Debug to verify replacements
        return yaml.parse(docString);
    });
    return docs;
};

// Generate dynamic Ingress resource
const generateIngressYaml = (username: string, replId: string): object => {
    return {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
            name: `${username}-${replId}-ingress`,
        },
        spec: {
            ingressClassName: "nginx",
            rules: [
                {
                    host: "localhost",
                    http: {
                        paths: [
                            {
                                path: `/${username}/${replId}/socket.io`, // WebSocket connection path
                                pathType: "ImplementationSpecific",
                                backend: {
                                    service: {
                                        name: `${username}-${replId}`, // Dynamic service name
                                        port: {
                                            number: 3000, // WebSocket backend port
                                        },
                                    },
                                },
                            },
                            {
                                path: `/${username}/${replId}`, // Standard HTTP traffic
                                pathType: "Prefix",
                                backend: {
                                    service: {
                                        name: `${username}-${replId}`,
                                        port: {
                                            number: 3000,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };
};



// Endpoint to start resources
app.post("/:username/:replId/start", async (req, res) => {
    const { username, replId } = req.params;
    const namespace = "default";

    try {
        const kubeManifests = readAndParseKubeYaml(
            path.join(__dirname, "../service.yaml"),
            username,
            replId
        );

        // Add dynamically generated Ingress manifest
        // kubeManifests.push(generateIngressYaml(username, replId));

        for (const manifest of kubeManifests) {
            try {
                switch (manifest.kind) {
                    case "Deployment":
                        await appsV1Api.createNamespacedDeployment(namespace, manifest);
                        console.log(`Created Deployment ${manifest.metadata.name}`);
                        break;

                    case "Service":
                        await coreV1Api.createNamespacedService(namespace, manifest);
                        console.log(`Created Service ${manifest.metadata.name}`);
                        break;

                    case "Ingress":
                        await networkingV1Api.createNamespacedIngress(namespace, manifest);
                        console.log(`Created Ingress ${manifest.metadata.name}`);
                        break;

                    default:
                        console.log(`Unsupported kind: ${manifest.kind}`);
                }
            } catch (error: any) {
                if (error.response && error.response.statusCode === 409) {
                    console.log(`Resource ${manifest.metadata.name} already exists. Ignoring error.`);
                    // Simply ignore the error and continue
                } else {
                    throw error; // Re-throw for non-409 errors
                }
            }
        }

        res.status(200).send({ message: "Resources created successfully (or already existed)" });
    } catch (error) {
        console.error("Failed to create resources", error);
        res.status(500).send({ message: "Failed to create resources" });
    }
});


// Endpoint to stop resources by scaling down the Deployment
app.post("/:username/:replId/stop", async (req, res) => {
    const { username, replId } = req.params;
    const namespace = "default";

    try {
        const deploymentName = `${username}-${replId}`;
        const serviceName = `${username}-${replId}`;
        const ingressName = `${username}-${replId}-ingress`;

        // Scale the Deployment down to 0 replicas
        await appsV1Api.patchNamespacedDeploymentScale(
            deploymentName,
            namespace,
            { spec: { replicas: 0 } },
            undefined,
            undefined,
            undefined,
            undefined,
        );

        console.log(`Scaled down Deployment ${deploymentName}`);

        // Optionally delete the Service and Ingress
        await coreV1Api.deleteNamespacedService(serviceName, namespace);
        console.log(`Deleted Service ${serviceName}`);

        await networkingV1Api.deleteNamespacedIngress(ingressName, namespace);
        console.log(`Deleted Ingress ${ingressName}`);

        res.status(200).send({ message: "Resources stopped successfully" });
    } catch (error) {
        console.error("Failed to stop resources", error);
        res.status(500).send({ message: "Failed to stop resources" });
    }
});

// Start the server
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
