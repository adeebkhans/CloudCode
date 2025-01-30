import fs from "fs";
import path from "path";

interface File {
    type: "file" | "dir"; // Specifies whether the item is a file or a directory
    name: string;         // The name of the file or directory
}

// Function to fetch the contents of a directory and return an array of File objects
export const fetchDir = (dir: string, baseDir: string): Promise<File[]> => {
    return new Promise((resolve, reject) => {
        // Use fs.readdir to read the directory contents
        fs.readdir(dir, { withFileTypes: true }, (err, files) => {
            if (err) {
                reject(err);
            } else {
                // Map the directory entries to an array of File objects (which is being returned)
                resolve(files.map(file => ({
                    type: file.isDirectory() ? "dir" : "file", // Check if the entry is a directory
                    name: file.name,                          // The name of the file or directory
                    path: `${baseDir}/${file.name}`           // Construct the relative path
                })));
            }
        });       
    });
}

// Function to fetch the content of a file and return it as a string
export const fetchFileContent = (file: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Use fs.readFile to read the file contents
        fs.readFile(file, "utf8", (err, data) => {
            if (err) {
                // Reject the promise if an error occurs
                reject(err);
            } else {
                // Resolve the promise with the file contents
                resolve(data);
            }
        });
    });
}

// Function to save (or overwrite) content to a file
export const saveFile = async (file: string, content: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Use fs.writeFile to write content to the file
        fs.writeFile(file, content, "utf8", (err) => {
            if (err) {
                // Reject the promise if an error occurs
                return reject(err);
            }
            // Resolve the promise when the file is successfully written
            resolve();
        });
    });
}

// Helper function to write a file locally
export async function writeFile(filePath: string, fileData: Buffer): Promise<void> {
    await createFolder(path.dirname(filePath));

    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileData, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Helper function to create directories recursively
function createFolder(dirName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirName, { recursive: true }, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
} 


// import fs from "fs";
// import path from "path";

// interface File {
//     type: "file" | "dir"; // Specifies whether the item is a file or a directory
//     name: string;         // The name of the file or directory
// }

// // Define the base directory for workspace restrictions
// const WORKSPACE_DIR = "/workspace";

// // Function to validate and resolve paths to ensure they stay within the workspace
// export function getValidatedPath(relativePath: string): string {
//     const fullPath = path.resolve(WORKSPACE_DIR, relativePath); // Resolve the full path
//     if (!fullPath.startsWith(WORKSPACE_DIR)) {
//         throw new Error("Access Denied: Path traversal is not allowed");
//     }
//     return fullPath;
// }

// // Function to fetch the contents of a directory and return an array of File objects
// export const fetchDir = (dir: string, baseDir: string): Promise<File[]> => {
//     return new Promise((resolve, reject) => {
//         const validatedPath = getValidatedPath(dir); // Validate the directory path
//         fs.readdir(validatedPath, { withFileTypes: true }, (err, files) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 // Map the directory entries to an array of File objects
//                 resolve(files.map(file => ({
//                     type: file.isDirectory() ? "dir" : "file", // Check if the entry is a directory
//                     name: file.name,                          // The name of the file or directory
//                     path: `${baseDir}/${file.name}`           // Construct the relative path
//                 })));
//             }
//         });
//     });
// };

// // Function to fetch the content of a file and return it as a string
// export const fetchFileContent = (file: string): Promise<string> => {
//     return new Promise((resolve, reject) => {
//         const validatedPath = getValidatedPath(file); // Validate the file path
//         fs.readFile(validatedPath, "utf8", (err, data) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(data); // Return the file content
//             }
//         });
//     });
// };

// // Function to save (or overwrite) content to a file
// export const saveFile = (file: string, content: string): Promise<void> => {
//     return new Promise((resolve, reject) => {
//         const validatedPath = getValidatedPath(file); // Validate the file path
//         fs.writeFile(validatedPath, content, "utf8", (err) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(); // Successfully written
//             }
//         });
//     });
// };

// // Helper function to write a file locally
// export async function writeFile(filePath: string, fileData: Buffer): Promise<void> {
//     const validatedPath = getValidatedPath(filePath); // Validate the file path
//     await createFolder(path.dirname(validatedPath));  // Ensure the folder structure exists

//     return new Promise((resolve, reject) => {
//         fs.writeFile(validatedPath, fileData, (err) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve();
//             }
//         });
//     });
// }

// // Helper function to create directories recursively
// function createFolder(dirName: string): Promise<void> {
//     const validatedPath = getValidatedPath(dirName); // Validate the directory path
//     return new Promise((resolve, reject) => {
//         fs.mkdir(validatedPath, { recursive: true }, (err) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve();
//             }
//         });
//     });
// }
