import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { CATALOG_PROMPT_TEXT } from "./catalog.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ─── segment-specific behavior instructions ────────────────────────────────────

const SEGMENT_INSTRUCTIONS = {
  residential: `
SEGMENT: RESIDENTIAL (Homeowner)
Follow these rules for this customer type:
- Write all recommendations in plain English a homeowner can understand. No technical jargon.
- All application rates in lbs per 1,000 sq ft only.
- Prefer bag products the homeowner can apply with a broadcast spreader.
- Program should be 3–4 applications per year maximum, with simple seasonal timing (Early Spring, Late Spring, Fall, Late Fall).
- Product list should show the bag quantities they need to buy for their total lawn size.
- Customer notes should be warm, friendly, and encouraging — written like advice from a trusted local store, not a lab report.
- Do not recommend liquid fertilizers, combination herbicide/fertilizer products, or professional-only products unless there is absolutely no other option.`,

  turf: `
SEGMENT: TURF / CONTRACTOR (Professional)
Follow these rules for this customer type:
- Use professional agronomic language. This customer understands XCU, pre-emergent, CEC, and fertility programs.
- All application rates in lbs per 1,000 sq ft AND total product needed for the full job acreage.
- Program should be detailed — 5–6 application windows including pre-emergent timing, fertilizer splits, and any liquid supplementation.
- Recommend the best agronomic product for the situation regardless of complexity — liquid fertilizers, combination products, and pre-emergents are all appropriate.
- Include tank mix notes where relevant (e.g. liquid iron with nitrogen application).
- Product list should show total bags or gallons needed for the full job with SKUs.
- Customer notes should be professional and concise, written like a program summary they can share with their own client.
- Flag any situations where a custom blend would outperform a bagged product.`,

  equine: `
SEGMENT: EQUINE & LIVESTOCK (Pasture Management)
Follow these rules for this customer type:
- Focus on forage quality, stand density, and weed suppression.
- All rates in lbs per acre.
- Program should follow a spring and fall structure typical for Mid-Atlantic pasture management.
- Note any products or nutrients that could be harmful to horses or livestock at high rates.
- Customer notes should acknowledge the connection between pasture quality and animal health.
- No Mill catalog products are available for this segment yet. Make agronomically sound recommendations and note "consult Mill staff for product and pricing" for every product entry.`,

  agronomy: `
SEGMENT: AGRONOMY (Farm / Row Crop)
Follow these rules for this customer type:
- Use full agronomic language appropriate for a farmer. Reference yield goals and economic thresholds.
- All rates in lbs per acre.
- Program should follow crop-specific timing (pre-plant, at-plant, side-dress, topdress as appropriate for the crop).
- Tailor recommendations to the specific crop and tillage system provided in the customer context.
- No Mill catalog products are available for this segment yet. Make agronomically sound recommendations and note "consult Mill staff for product and pricing" for every product entry.`,
};

// ─── catalog injection (residential and turf only) ────────────────────────────

const CATALOG_INJECTION = `

You must ONLY recommend products from The Mill's official catalog listed below. Rules:
- Always include the exact product name AND SKU in every recommendation (e.g. "Dolomitic Pelletized Lime, SKU 1158240").
- Never suggest generic product names or brands not in this catalog.
- Match products precisely to the soil deficiency: for example, if Mg is low use Dolomitic Pelletized Lime (SKU 1158240) or Solu-Cal Magnesium Pelletized Lime (SKU 11110513) rather than a Hi Calcium lime. If pH is correct and only Ca is low, use Gypsum (SKU 115204). If P is deficient use 0-45-0 Triple Superphosphate (SKU 115173) or a high-P starter. If K is low and crop is sensitive to chloride, use 0-0-50 Sulfate of Potash (SKU 1154218) over Muriate of Potash.
- For turf seeding recommendations, select a seed product from the catalog that matches the segment (e.g. pasture seed for equine, erosion-control seed for construction, shade mix for shaded areas).
- Include SKUs in the "product" field of every annualProgram application and every productList entry.

LIME RECOMMENDATION RULES — FOLLOW THESE EXACTLY:

Solu-Cal is The Mill's preferred and recommended lime product for all residential and turf contractor customers. Always recommend Solu-Cal over standard pelletized or pulverized lime unless there is a specific reason not to.

Why Solu-Cal: It corrects soil pH in 6–8 weeks vs. 10–18 months for traditional lime. One 50 lb bag equals the effectiveness of four 50 lb bags of standard lime. It contains beneficial microbes (Intensify Microbial Biocatalyst) that improve nutrient uptake. It produces 80% less dust during application. University tested at Penn State and Rutgers.

ALWAYS select the correct Solu-Cal variant based on soil data:
- Low pH + Magnesium (Mg) below 80 ppm OR %Mg below 12% → recommend Solu-Cal Magnesium Pelletized Lime (SKU 11110513)
- Low pH + Mg adequate → recommend Solu-Cal Hi Cal Calcium Pelletized Lime (SKU 11110512)
- Low pH + Organic Matter below 2.5% → recommend Solu-Cal Humic Plus (SKU 1103740) — adds humic acids to feed soil biology while correcting pH
- Low pH + compaction or water infiltration issues noted → recommend Solu-Cal Aqua Ca Humic Plus (SKU 11111035) — includes hydration surfactant

APPLICATION RATES — use these exact rates:
- To RAISE pH: 12.5 lbs per 1,000 sq ft (residential) or 550 lbs per acre (turf contractor)
- To MAINTAIN pH: 6 lbs per 1,000 sq ft or 260 lbs per acre
- Maximum per application: 12.5 lbs per 1,000 sq ft — if more lime is needed, split into multiple applications 8 weeks apart, up to 3 per year
- One 50 lb bag covers 4,000 sq ft at the raise rate

LIME STRATEGY SECTION — when writing the limeStrategy field in the JSON output, always:
1. Lead with the recommended Solu-Cal product by name and SKU
2. Explain in plain English why Solu-Cal works faster than traditional lime (same season results)
3. Give the exact rate and number of bags needed based on the customer's lawn size or acreage
4. Note the split application schedule if total lime needed exceeds 12.5 lbs per 1,000 sq ft
5. For residential customers: explain this in simple terms — "instead of waiting a year to see results, you'll see improvement this season"
6. For turf contractors: include the per-acre rate, total product needed for the job, and note the labor/storage savings vs. traditional lime

NEVER recommend standard pelletized lime, pulverized lime, or dolomitic ground limestone as the primary lime product for residential or turf segments. Those products may only be mentioned as a backup if Solu-Cal is unavailable.

THE MILL — OFFICIAL PRODUCT CATALOG:

${CATALOG_PROMPT_TEXT}`;

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the segment ID from the user message text.
 * The frontend always opens the user message with "Segment: <label>".
 * Maps the human-readable label back to an internal ID.
 */
function extractSegment(body) {
  try {
    const content = body?.messages?.[0]?.content;
    const textBlock = Array.isArray(content)
      ? content.find((b) => b.type === "text")?.text
      : null;
    if (!textBlock) return null;

    const match = textBlock.match(/^Segment:\s*(.+)/m);
    if (!match) return null;

    const label = match[1].trim().toLowerCase();
    if (label.includes("residential"))               return "residential";
    if (label.includes("turf") || label.includes("contractor")) return "turf";
    if (label.includes("equine") || label.includes("livestock")) return "equine";
    if (label.includes("agronomy"))                  return "agronomy";
  } catch (_) {}
  return null;
}

/**
 * Build the text to append to the system prompt for a given segment.
 * Equine and agronomy skip the catalog constraint — staff pricing/availability
 * for those segments is handled manually.
 */
function buildSystemAddition(segment) {
  const instructions = SEGMENT_INSTRUCTIONS[segment] ?? "";
  const useCatalog = segment === "residential" || segment === "turf";
  return instructions + (useCatalog ? CATALOG_INJECTION : "");
}

// ─── route ────────────────────────────────────────────────────────────────────

app.post("/api/analyze", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server." });
  }

  try {
    const segment = extractSegment(req.body);
    const addition = buildSystemAddition(segment);

    const body = { ...req.body };
    if (typeof body.system === "string" && addition) {
      body.system = body.system + addition;
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
