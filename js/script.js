// server.js (no Glitch)

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// --- Middlewares (ESSENCIAL) ---
// A linha abaixo é a mais importante: ela "lê" o JSON enviado pelo frontend.
// DEVE VIR ANTES DE QUALQUER ROTA (app.post).
app.use(express.json());
app.use(cors());

// --- Endpoint da API ---
app.post("/api/consulta-processo", async (req, res) => {
  const { numeroProcesso, courtAcronym } = req.body;

  if (!numeroProcesso || !courtAcronym) {
    return res.status(400).json({ message: "Número do processo e sigla do tribunal são obrigatórios." });
  }

  const datajudUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${courtAcronym}/_search`;
  const requestBody = {
    query: { match: { numeroProcesso: numeroProcesso } },
  };
  const apiKey = process.env.DATAJUD_API_KEY;

  console.log(`Consultando processo ${numeroProcesso} no tribunal ${courtAcronym}`);

  try {
    const datajudResponse = await axios.post(datajudUrl, requestBody, {
      headers: {
        "Authorization": `APIKey ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    res.json(datajudResponse.data);
  } catch (error) {
    console.error("Erro na API do DataJud:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.reason || "Erro ao se comunicar com o serviço de consulta.";
    res.status(status).json({ message });
  }
});

// --- Inicia o Servidor ---
const listener = app.listen(process.env.PORT, () => {
  console.log("Seu app está ouvindo na porta " + listener.address().port);
});