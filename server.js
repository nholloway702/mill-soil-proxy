import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { CATALOG, buildCatalogText } from "./catalog.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ─── segment behavior instructions ────────────────────────────────────────────

const SEGMENT_INSTRUCTIONS = {
  residential: `
SEGMENT: RESIDENTIAL (Homeowner)
- Write all recommendations in plain English a homeowner can understand. No technical jargon.
- All application rates in lbs per 1,000 sq ft only.
- Prefer bag products the homeowner can apply with a broadcast spreader.
- Program should follow The Mill's 8-step seasonal flow (see below).
- Product list should show the bag quantities they need to buy for their total lawn size.
- Customer notes should be warm, friendly, and encouraging — written like advice from a trusted local store, not a lab report.`,

  turf: `
SEGMENT: TURF / CONTRACTOR (Professional)
- Use professional agronomic language. This customer understands XCU, pre-emergent, CEC, and fertility programs.
- All application rates in lbs per 1,000 sq ft AND total product needed for the full job acreage.
- Program should be detailed — 5–6 application windows including pre-emergent timing, fertilizer splits, and any liquid supplementation.
- Recommend the best agronomic product for the situation — liquid fertilizers, combination products, pre-emergents, fungicides, and probiotics are all appropriate.
- Include tank mix notes where relevant (e.g. liquid iron with nitrogen application).
- Product list should show total bags or gallons needed for the full job with SKUs.
- Customer notes should be professional and concise, written like a program summary they can share with their own client.
- Flag any situations where a custom blend would outperform a bagged product.`,

  equine: `
SEGMENT: EQUINE & LIVESTOCK (Pasture Management)
- Focus on forage quality, stand density, and weed suppression.
- All rates in lbs per acre.
- Program should follow a spring and fall structure typical for Mid-Atlantic pasture management.
- Note any products or nutrients that could be harmful to horses or livestock at high rates.
- Customer notes should acknowledge the connection between pasture quality and animal health.
- No Mill catalog products are available for this segment yet. Make agronomically sound recommendations and note "consult Mill staff for product and pricing" for every product entry.`,

  agronomy: `
SEGMENT: AGRONOMY (Farm / Row Crop)
- Use full agronomic language appropriate for a farmer. Reference yield goals and economic thresholds.
- All rates in lbs per acre.
- Program should follow crop-specific timing (pre-plant, at-plant, side-dress, topdress as appropriate).
- Tailor recommendations to the specific crop and tillage system provided in the customer context.
- No Mill catalog products are available for this segment yet. Make agronomically sound recommendations and note "consult Mill staff for product and pricing" for every product entry.`,
};

// ─── residential: Lawn Care Guide decision tree ───────────────────────────────

const RESIDENTIAL_DECISION_TREE = `

Only recommend products from the catalog at the bottom of these instructions. Do not reference or suggest any products outside this list. Always include the exact product name AND SKU in every recommendation.

LAWN CARE GUIDE — FERTILIZER & PRODUCT DECISION TREE:

PRIMARY FERTILIZER SELECTION:
- Existing established lawn → 22-0-14 50% XCU with 5% Iron (SKU 115135) is the go-to primary fertilizer. The 5% iron delivers deep green color and promotes thick healthy turf.
- New lawn or overseeding mentioned in context → 18-24-12 50% XCU Starter Fertilizer (SKU 115137). Promotes root growth, establishes new lawn faster. Only recommend for new seeding or when soil calls for phosphorus.

SPRING PRE-EMERGENT (March–April) — REQUIRED IN EVERY RESIDENTIAL PROGRAM:
Every residential program must include a March–April pre-emergent step. The only exception is if the customer is overseeding or establishing a new lawn — in that case, skip pre-emergent and explain why.
- Default (no overseeding) → 19-0-6 Lockup .17 Dimension (SKU 115100) — prevents crabgrass, kills existing broadleaf weeds, and prepares the lawn for summer. This is the standard spring step for all residential programs.
- Customer mentions both weeds AND insects as concerns → 13-0-5 Acelepryn/Dimension (SKU 115088) — combines pre-emergent weed control with season-long grub and insect protection in one application.
- Do NOT skip this step unless the customer is overseeding.

SUMMER GRUB/INSECT CONTROL (May–June) — REQUIRED IN EVERY RESIDENTIAL PROGRAM:
Every residential program must include a May–June grub and insect control step. Always note it controls grubs, armyworms, fleas, ants, and other turf insects.
- Small lawn or budget-conscious → 0-0-7 .067 Acelepryn (SKU 115084) — pure insect control, no nitrogen added.
- Customer wants feeding plus insect control in one pass → 15-0-5 .067 Acelepryn (SKU 115114) — feeds the lawn while providing season-long insect protection.
- If 13-0-5 Acelepryn/Dimension (SKU 115088) was used in spring, note that grub protection may already be covered and adjust accordingly.

FALL FEEDING (October–November):
- Soil pH at or above 6.0 → 19-0-10 20% XCU 13% CA 2% FE (SKU 115110) — thick green fall turf, prepares roots for winter, contains 22% Solu-Cal to maintain pH.
- Soil pH still needs correction → 32-0-6 30% XCU (SKU 115952) paired with a Solu-Cal lime application. Note: 32-0-6 is a fall winterizing option when pH still needs work — it is NOT the default fertilizer for residential programs.

8-STEP SEASONAL PROGRAM STRUCTURE:
1. Late Winter — Soil analysis (already complete)
2. March–April — Pre-emergent weed control (REQUIRED — skip only if overseeding, and explain why)
3. May–June — Primary fertilizer application
4. May–June — Grub/insect control (REQUIRED — controls grubs, armyworms, fleas, ants, and other turf insects)
5. September — Seed if needed
6. September — Greener grass application (18-24-12 starter for new lawns, 22-0-14 for established)
7. October–November — Fall feeding (19-0-10 if pH is at or above 6.0; 32-0-6 paired with lime if pH still needs work)
8. Spring/Fall/Winter — Lime as needed per the Solu-Cal rules below

PRODUCT QUANTITY CALCULATIONS — FOLLOW EXACTLY:
The estimatedQty field in productList must always be the total bags needed for the whole lawn for the full season.
- Step 1: Get lawn size from customer context. If not provided, assume 5,000 sq ft and state that assumption.
- Step 2: Calculate total lbs needed = (lawn size in sq ft ÷ 1,000) × rate per 1,000 sq ft × number of applications.
- Step 3: Divide total lbs by 50 to get bag count. Round up to the nearest whole bag.
- Step 4: Express as "X bags (50 lb each)" — never as "X bags per 1,000 sq ft".
- Example: 5,000 sq ft lawn, 3 lime applications at 12.5 lbs/1,000 sq ft = (5 × 12.5 × 3) = 187.5 lbs = 4 bags (50 lb each).
- Example: 5,000 sq ft lawn, 3 fertilizer applications at 4.5 lbs/1,000 sq ft = (5 × 4.5 × 3) = 67.5 lbs = 2 bags (50 lb each).

LIME RATES AND LANGUAGE — CRITICAL RULES:
- The maximum Solu-Cal rate is 12.5 lbs per 1,000 sq ft per application.
- Never state a total lime rate higher than 12.5 lbs per 1,000 sq ft in a single sentence.
- If more lime is needed, always express it as multiple applications: "X applications of 12.5 lbs per 1,000 sq ft spaced 8 weeks apart."
- Maximum 3 applications per year. If more than 3 applications are needed, continue into the following year.
- One 50 lb bag covers 4,000 sq ft at the raise rate (12.5 lbs/1,000 sq ft).

LIME SELECTION — FOLLOW THESE RULES EXACTLY:
Always recommend Solu-Cal over standard pelletized or pulverized lime for residential customers.
- Low pH + Mg below 80 ppm OR %Mg below 12% → Solu-Cal Magnesium Pelletized Lime (SKU 11110513)
- Low pH + Mg adequate → Solu-Cal Hi Cal Calcium Pelletized Lime (SKU 11110512)
- Low pH + Organic Matter below 2.5% → Solu-Cal Humic Plus (SKU 1103740)
- Low pH + compaction or water infiltration issues → Solu-Cal Aqua Ca Humic Plus (SKU 11111035)
In the limeStrategy field: name the specific Solu-Cal product and SKU, explain why it works faster than traditional lime (same-season results vs. 10–18 months for standard lime), state the number of applications needed as "X applications of 12.5 lbs per 1,000 sq ft spaced 8 weeks apart", give the exact total bag count for the full lawn, and note if the schedule runs into the following year.

THE MILL — RESIDENTIAL PRODUCT CATALOG:

`;

// ─── turf: full catalog preamble ──────────────────────────────────────────────

const TURF_CATALOG_PREAMBLE = `

Only recommend products from The Mill's catalog listed below. Do not reference or suggest products outside this list. Always include the exact product name AND SKU in every recommendation.

- Match products precisely to soil deficiencies and program needs.
- If Mg is low use Dolomitic Pelletized Lime (SKU 1158240) or Solu-Cal Magnesium (SKU 11110513) rather than Hi Calcium lime. If pH is correct and only Ca is low, use Gypsum (SKU 115204). If P is deficient use 0-45-0 Triple Superphosphate (SKU 115173). If K is low and crop is chloride-sensitive, use 0-0-50 Sulfate of Potash (SKU 1154218) over Muriate of Potash.
- Include SKUs in the "product" field of every annualProgram application and every productList entry.

SOLU-CAL LIME RULES:
Solu-Cal is The Mill's preferred lime for turf contractor customers.
- Low pH + Mg below 80 ppm OR %Mg below 12% → Solu-Cal Magnesium Pelletized Lime (SKU 11110513)
- Low pH + Mg adequate → Solu-Cal Hi Cal Calcium Pelletized Lime (SKU 11110512)
- Low pH + Organic Matter below 2.5% → Solu-Cal Humic Plus (SKU 1103740)
- Low pH + compaction or water infiltration issues → Solu-Cal Aqua Ca Humic Plus (SKU 11111035)
Rates: 550 lbs per acre to raise pH; 260 lbs per acre to maintain. Split if total needed exceeds one application.
In the limeStrategy field: name the Solu-Cal product and SKU, give per-acre rate, total product for the full job, and note labor/storage savings vs traditional lime.

THE MILL — FULL PRODUCT CATALOG:

`;

// ─── SKUs included in every residential recommendation ────────────────────────

const RESIDENTIAL_CORE_SKUS = new Set([
  "115135",   // 22-0-14 50% XCU with 5% Iron — established lawn primary
  "115137",   // 18-24-12 50% XCU Starter — new lawn / overseeding
  "115952",   // 32-0-6 30% XCU — fall winterizer when pH needs work
  "115110",   // 19-0-10 20% XCU 13% CA 2% FE — fall when pH ok
  "115101",   // 18-0-4 .38 Prodiamine — spring pre-emergent (alternate)
  "115100",   // 19-0-6 Lockup .17 Dimension — default spring pre-emergent + weed
  "115088",   // 13-0-5 Acelepryn/Dimension — spring combo when weeds + insects both concern
  "115084",   // 0-0-7 .067 Acelepryn — summer grub, no N
  "115114",   // 15-0-5 .067 Acelepryn — summer grub, with N
  "10234071", // 6-4-0 Milorganite — organic option
]);

// ─── helpers ──────────────────────────────────────────────────────────────────

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
    if (label.includes("residential"))                          return "residential";
    if (label.includes("turf") || label.includes("contractor")) return "turf";
    if (label.includes("equine") || label.includes("livestock")) return "equine";
    if (label.includes("agronomy"))                             return "agronomy";
  } catch (_) {}
  return null;
}

function extractContextText(body) {
  try {
    const content = body?.messages?.[0]?.content;
    const textBlock = Array.isArray(content)
      ? content.find((b) => b.type === "text")?.text
      : null;
    return textBlock?.toLowerCase() ?? "";
  } catch (_) { return ""; }
}

/**
 * Build the system prompt addition for a given segment.
 *
 * Residential — Lawn Care Guide decision tree + focused product catalog.
 * Turf        — full 101-product catalog, professional judgment.
 * Equine/Agronomy — segment instructions only, no catalog (staff handles manually).
 */
function buildSystemAddition(segment, body) {
  const instructions = SEGMENT_INSTRUCTIONS[segment] ?? "";

  if (segment === "residential") {
    const contextText = extractContextText(body);
    const limeProducts = CATALOG.filter(p => p.category === "Lime & Soil Conditioners");
    const coreProducts = CATALOG.filter(p => RESIDENTIAL_CORE_SKUS.has(p.sku));
    const products = [...limeProducts, ...coreProducts];
    if (/overseed|renovation|new lawn|new seeding|bare spots/i.test(contextText)) {
      products.push(...CATALOG.filter(p => p.category.startsWith("Grass Seed")));
    }
    return instructions + RESIDENTIAL_DECISION_TREE + buildCatalogText(products);
  }

  if (segment === "turf") {
    return instructions + TURF_CATALOG_PREAMBLE + buildCatalogText(CATALOG);
  }

  // equine and agronomy: no catalog injection
  return instructions;
}

// ─── route ────────────────────────────────────────────────────────────────────

app.post("/api/analyze", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server." });
  }

  console.log(`[analyze] Request received — segment: ${extractSegment(req.body) ?? "unknown"}`);

  try {
    const segment = extractSegment(req.body);
    const addition = buildSystemAddition(segment, req.body);

    const fullSystemPrompt = typeof req.body.system === "string" && addition
      ? req.body.system + addition
      : req.body.system;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        ...req.body,
        stream: false,
        system: fullSystemPrompt,
      }),
    });

    const data = await anthropicResponse.json();
    console.log(`[analyze] Sending response — status ${anthropicResponse.status}`);
    res.status(anthropicResponse.status).json(data);
  } catch (err) {
    console.error("[analyze] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Mill Soil proxy listening on port ${PORT}`);
});
