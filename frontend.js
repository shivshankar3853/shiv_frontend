require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || "https://shiv-websocket.onrender.com";

let accessToken = null;

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "frontend",
    timestamp: new Date().toISOString() 
  });
});

app.get("/manifest.json", (req, res) => {
  res.sendFile(path.join(__dirname, "manifest.json"));
});

app.get("/sw.js", (req, res) => {
  res.setHeader("Service-Worker-Allowed", "/");
  res.sendFile(path.join(__dirname, "sw.js"));
});

app.get("/api/search", async (req, res) => {
  try {
    const { q, type } = req.query;
    let url = `${BACKEND_URL}/api/search?q=${encodeURIComponent(q)}`;
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

app.post("/api/verify-pin", express.json(), async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/verify-pin`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Verification failed" });
  }
});

app.post("/api/change-pin", express.json(), async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/change-pin`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Change failed" });
  }
});

app.get("/api/logs", async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/logs`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Fetch logs failed" });
  }
});

app.get("/get-token", (req, res) => {
  if (accessToken) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

app.post("/set-token", express.json(), (req, res) => {
  accessToken = req.body.token;
  res.json({ status: "token set" });
});

server.listen(PORT, () => {
  console.log(`🚀 Frontend server running at http://localhost:${PORT}`);
});
