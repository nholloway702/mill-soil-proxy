import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { CATALOG_PROMPT_TEXT } from "./catalog.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const CATALOG_INJECTION = `

You must ONLY recommend products from The Mill of Bel Air's official catalog listed below. Rules:
- Always include the exact product name AND SKU in every recommendation (e.g. "Dolomitic Pelletized Lime, SKU 1158240").
- Never suggest generic product names or brands not in this catalog.
- Match products precisely to the soil deficiency: for example, if Mg is low use Dolomitic Pelletized Lime (SKU 1158240) or Solu-Cal Magnesium Pelletized Lime (SKU 11110513) rather than a Hi Calcium lime. If pH is correct and only Ca is low, use Gypsum (SKU 115204). If P is deficient use 0-45-0 Triple Superphosphate (SKU 115173) or a high-P starter. If K is low and crop is sensitive to chloride, use 0-0-50 Sulfate of Potash (SKU 1154218) over Muriate of Potash.
- For turf seeding recommendations, select a seed product from the catalog that matches the segment (e.g. pasture seed for equine, erosion-control seed for construction, shade mix for shaded areas).
- Include SKUs in the "product" field of every annualProgram application and every productList entry.

THE MILL OF BEL AIR — OFFICIAL PRODUCT CATALOG:

${CATALOG_PROMPT_TEXT}`;

app.post("/api/analyze", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server." });
  }

  try {
    // Append catalog to whatever system prompt the frontend sent
    const body = { ...req.body };
    if (typeof body.system === "string") {
      body.system = body.system + CATALOG_INJECTION;
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).json({ error: "Failed to reach Anthropic API.", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Mill Soil proxy listening on port ${PORT}`);
});
