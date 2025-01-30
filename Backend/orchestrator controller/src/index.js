"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const client_node_1 = require("@kubernetes/client-node");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const kubeconfig = new client_node_1.KubeConfig();
kubeconfig.loadFromDefault();
const coreV1Api = kubeconfig.makeApiClient(client_node_1.CoreV1Api);
const appsV1Api = kubeconfig.makeApiClient(client_node_1.AppsV1Api);
const networkingV1Api = kubeconfig.makeApiClient(client_node_1.NetworkingV1Api);
// Updated utility function to handle multi-document YAML files
const readAndParseKubeYaml = (filePath, username, replId) => {
    const fileContent = fs_1.default.readFileSync(filePath, "utf8");
    const docs = yaml_1.default.parseAllDocuments(fileContent).map((doc) => {
        let docString = doc.toString();
        docString = docString.replace(/service_name/g, `${username}-${replId}`);
        docString = docString.replace(/\${USERNAME}/g, username);
        docString = docString.replace(/\${REPLID}/g, replId);
        console.log(docString); // Debug to verify replacements
        return yaml_1.default.parse(docString);
    });
    return docs;
};
// Generate dynamic Ingress resource
const generateIngressYaml = (username, replId) => {
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
                                path: `/${username}/${replId}`,
                                pathType: "Prefix",
                                backend: {
                                    service: {
                                        name: `${username}-${replId}`,
                                        port: {
                                            number: 3001,
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
app.post("/:username/:replId/start", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, replId } = req.params;
    const namespace = "default";
    try {
        const kubeManifests = readAndParseKubeYaml(path_1.default.join(__dirname, "../service.yaml"), username, replId);
        // Add dynamically generated Ingress manifest
        kubeManifests.push(generateIngressYaml(username, replId));
        for (const manifest of kubeManifests) {
            switch (manifest.kind) {
                case "Deployment":
                    yield appsV1Api.createNamespacedDeployment(namespace, manifest);
                    break;
                case "Service":
                    yield coreV1Api.createNamespacedService(namespace, manifest);
                    break;
                case "Ingress":
                    yield networkingV1Api.createNamespacedIngress(namespace, manifest);
                    break;
                default:
                    console.log(`Unsupported kind: ${manifest.kind}`);
            }
        }
        res.status(200).send({ message: "Resources created successfully" });
    }
    catch (error) {
        console.error("Failed to create resources", error);
        res.status(500).send({ message: "Failed to create resources" });
    }
}));
// Endpoint to stop resources by scaling down the Deployment
app.post("/:username/:replId/stop", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, replId } = req.params;
    const namespace = "default";
    try {
        const deploymentName = `${username}-${replId}`;
        const serviceName = `${username}-${replId}`;
        const ingressName = `${username}-${replId}-ingress`;
        // Scale the Deployment down to 0 replicas
        yield appsV1Api.patchNamespacedDeploymentScale(deploymentName, namespace, { spec: { replicas: 0 } }, undefined, undefined, undefined, undefined);
        console.log(`Scaled down Deployment ${deploymentName}`);
        // Optionally delete the Service and Ingress
        yield coreV1Api.deleteNamespacedService(serviceName, namespace);
        console.log(`Deleted Service ${serviceName}`);
        yield networkingV1Api.deleteNamespacedIngress(ingressName, namespace);
        console.log(`Deleted Ingress ${ingressName}`);
        res.status(200).send({ message: "Resources stopped successfully" });
    }
    catch (error) {
        console.error("Failed to stop resources", error);
        res.status(500).send({ message: "Failed to stop resources" });
    }
}));
// Start the server
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
