const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "farms.json");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const fsp = fs.promises;

async function ensureDataFile() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    await fsp.access(DATA_FILE);
  } catch (err) {
    await fsp.writeFile(DATA_FILE, "[]\n", "utf8");
  }
}

async function readFarms() {
  await ensureDataFile();
  const raw = await fsp.readFile(DATA_FILE, "utf8");
  const normalized = raw.replace(/^\uFEFF/, "");
  if (!normalized.trim()) return [];
  const data = JSON.parse(normalized);
  return Array.isArray(data) ? data : [];
}

async function writeFarms(list) {
  await ensureDataFile();
  await fsp.writeFile(DATA_FILE, JSON.stringify(list, null, 2) + "\n", "utf8");
}

app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/farms", async (req, res) => {
  try {
    const farms = await readFarms();
    res.setHeader("Cache-Control", "no-store");
    res.json({ farms });
  } catch (err) {
    res.status(500).json({ error: "Falha ao ler farms.json" });
  }
});

app.put("/api/farms", async (req, res) => {
  try {
    const payload = req.body;
    const farms = Array.isArray(payload) ? payload : payload?.farms;
    if (!Array.isArray(farms)) {
      return res.status(400).json({ error: "Payload deve ser um array de fazendas." });
    }
    await writeFarms(farms);
    res.json({ ok: true, farms });
  } catch (err) {
    res.status(500).json({ error: "Falha ao salvar farms.json" });
  }
});

app.use(express.static(FRONTEND_DIR));
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor local rodando em http://localhost:${PORT}`);
});

