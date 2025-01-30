import express from "express";
import dotenv from "dotenv"
dotenv.config();
import { createServer } from "http";
import cors from "cors";
import { initWs } from "./socket";

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// createServer wraps the Express app in an HTTP server. Express itself has underlying http.Server instance in it. 
// Wrapping is necessary because the WebSocket integration (initWs) requires direct access to the HTTP server instance.
const httpServer = createServer(app) 
initWs(httpServer);



const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`listening on *:${port}`);
});