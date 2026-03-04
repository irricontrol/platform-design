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
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://platform-design.netlify.app"
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Fallback para dev
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Healthcheck (Uptime Bot)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/farms", async (req, res) => {
  try {
    const farms = await readFarms();
    res.setHeader("Cache-Control", "no-store");
    res.json({ farms });
  } catch (err) {
    console.error("Erro na rota /api/farms:", err);
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
    console.error("Erro na rota PUT /api/farms:", err);
    res.status(500).json({ error: "Falha ao salvar farms.json" });
  }
});

app.use(express.static(FRONTEND_DIR));

app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// Inicialização com tratamento de erro
async function start() {
  try {
    console.log("--- Iniciando Serviço ---");
    console.log(`Porta: ${PORT}`);
    console.log(`Diretório Raiz: ${ROOT_DIR}`);
    console.log(`Diretório Frontend: ${FRONTEND_DIR}`);

    await ensureDataFile();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor pronto e escutando em 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("FALHA AO INICIAR SERVIDOR:", err);
    process.exit(1);
  }
}

start();

