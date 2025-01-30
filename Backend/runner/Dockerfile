# Use the official Node.js 20 as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /code

# Copy package.json and package-lock.json (if available) [source:package*.json destination:./]
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ts-node-dev globally for development convenience
RUN npm install -g ts-node-dev

# Copy the rest of your application code into the container
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the application using ts-node-dev
CMD ["ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"]
