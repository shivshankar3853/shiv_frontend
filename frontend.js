require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) {
  console.error("❌ ERROR: BACKEND_URL is missing in frontend/.env!");
}

const PORT = process.env.PORT || 3000;
let accessToken = null;

// Middleware for parsing JSON/Form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API: Config
app.get("/api/config", (req, res) => {
  res.json({ BACKEND_URL });
});

// API: Sync Instruments
app.get("/api/sync-instruments", async (req, res) => {
  console.log("🔄 Proxying sync instruments request to:", BACKEND_URL);
  try {
    const response = await axios.get(`${BACKEND_URL}/api/sync-instruments`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Sync failed" });
  }
});

// API: Search
app.get("/api/search", async (req, res) => {
  try {
    const { q, segment } = req.query;
    let url = `${BACKEND_URL}/api/search?q=${encodeURIComponent(q)}`;
    if (segment) {
      url += `&segment=${encodeURIComponent(segment)}`;
    }
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

// API: Segments
app.get("/api/segments", async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/segments`);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Proxy Segments Error:", error.response?.data || error.message);
    res.status(500).json(error.response?.data || { error: "Failed to fetch segments" });
  }
});

// API: PIN Management
app.post("/api/verify-pin", async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/verify-pin`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Verification failed" });
  }
});

app.post("/api/change-pin", async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/change-pin`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Change failed" });
  }
});

// API: Logs
app.get("/api/logs", async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    let url = `${BACKEND_URL}/api/logs?`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    if (limit) url += `limit=${limit}&`;
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Fetch logs failed" });
  }
});

app.delete("/api/logs", async (req, res) => {
  try {
    const response = await axios.delete(`${BACKEND_URL}/api/logs`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Delete all logs failed" });
  }
});

app.delete("/api/logs/:id", async (req, res) => {
  try {
    const response = await axios.delete(`${BACKEND_URL}/api/logs/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Delete log failed" });
  }
});

// Token endpoints
app.get("/get-token", (req, res) => {
  if (accessToken) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

app.post("/set-token", (req, res) => {
  accessToken = req.body.token;
  res.json({ status: "token set" });
});

// Static files
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

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

server.listen(PORT, () => {
  console.log(`🚀 Frontend server running at http://localhost:${PORT}`);
});
