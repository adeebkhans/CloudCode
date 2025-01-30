import { S3Client, ListObjectsV2Command, GetObjectCommand, CopyObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import {writeFile} from "./fileHandling"

const s3 = new S3Client({
    region: process.env.AWS_REGION, // Specify the AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    endpoint: process.env.S3_ENDPOINT, // Optional: S3-compatible endpoint
});

// Function to fetch an S3 folder and download its contents to the local filesystem
export const fetchS3Folder = async (key: string, localPath: string): Promise<void> => {
    const params = {
        Bucket: process.env.S3_BUCKET || "",
        Prefix: key,
    };

    try {
        const command = new ListObjectsV2Command(params);
        const response = await s3.send(command);

        if (response.Contents) {
            for (const file of response.Contents) {
                const fileKey = file.Key;
                if (fileKey) {
                    const getObjectParams = {
                        Bucket: process.env.S3_BUCKET || "",
                        Key: fileKey,
                    };

                    const getObjectCommand = new GetObjectCommand(getObjectParams);
                    const data = await s3.send(getObjectCommand);

                    if (data.Body) {
                        const fileData = await streamToBuffer(data.Body as Readable);
                        const filePath = `${localPath}/${fileKey.replace(key, "")}`;
                        await writeFile(filePath, fileData); // logic to create local file in fileHandling.ts
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error fetching S3 folder:", error);
    }
};

// Function to copy all objects from one S3 folder to another
export const copyS3Folder = async (sourcePrefix: string, destinationPrefix: string, continuationToken?: string): Promise<void> => {
    try {
        const listParams = {
            Bucket: process.env.S3_BUCKET || "",
            Prefix: sourcePrefix,
            ContinuationToken: continuationToken,
        };

        const command = new ListObjectsV2Command(listParams);
        const listedObjects = await s3.send(command);

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;

        for (const object of listedObjects.Contents) {
            if (!object.Key) continue;
            const destinationKey = object.Key.replace(sourcePrefix, destinationPrefix);

            const copyParams = {
                Bucket: process.env.S3_BUCKET || "",
                CopySource: `${process.env.S3_BUCKET}/${object.Key}`,
                Key: destinationKey,
            };

            const copyCommand = new CopyObjectCommand(copyParams);
            await s3.send(copyCommand);
            console.log(`Copied ${object.Key} to ${destinationKey}`);
        }

        if (listedObjects.IsTruncated) {
            await copyS3Folder(sourcePrefix, destinationPrefix, listedObjects.NextContinuationToken);
        }
    } catch (error) {
        console.error("Error copying S3 folder:", error);
    }
};

// Function to upload a file to S3
export const saveToS3 = async (key: string, filePath: string, content: string): Promise<void> => {
    const params = {
        Bucket: process.env.S3_BUCKET || "",
        Key: `${key}${filePath}`,
        Body: content,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
        console.log(`Saved file to S3: ${key}${filePath}`);
    } catch (error) {
        console.error("Error saving to S3:", error);
    }
};


// Helper function to convert a readable stream to a buffer
function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
}
