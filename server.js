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

THE MILL 4-STEP LAWN PROGRAM — PRIMARY RECOMMENDATION FOR ALL RESIDENTIAL CUSTOMERS:

STEP 1 — Early Spring (Mid-March to April 15):
Product: 18-0-4 25% PCU with 0.38% Prodiamine (SKU 115101)
Rate: 1 bag per 12,500 sq ft
Purpose: Pre-emergent weed preventer with fertilizer. Controls crabgrass, Japanese stilt grass, sand burs, and other annual weeds. This is THE #1 recommended spring pre-emergent — always lead with this for spring.
EXCEPTION: If customer mentions overseeding, new lawn, or bare spots — skip Step 1 entirely and use 18-24-12 50% XCU Starter Fertilizer (SKU 115137) instead. Explain in the program that pre-emergent was skipped to allow seeding.

STEP 2 — Mid-Spring (Mid-May to June 1, 6–8 weeks after Step 1):
Product: 19-0-6 Lockup .17 Dimension (SKU 115100)
Rate: 1 bag per 11,400 sq ft
Purpose: Pre-emergent weed preventer plus post-emergent broadleaf weed control. Follow-up to Step 1 for full-program customers. Prevents late crabgrass and knocks out any existing broadleaf weeds.

STEP 3 — Late Summer (Labor Day, early September):
Product: 22-0-14 50% XCU with 5% Iron (SKU 115135)
Rate: 1 bag per 12,500 sq ft
Purpose: Strengthens the plant and creates green-up after summer stress. The 5% iron delivers deep color. Crucial for rejuvenating grass after summer heat.

STEP 4 — Mid-Fall (Mid to Late October):
Product: 32-0-6 30% XCU (SKU 115952)
Rate: 1 bag per 12,500 sq ft
Purpose: Winterization fertilizer to prepare the lawn for next spring. Provides great growth and green-up. 32-0-6 is the Step 4 fall winterizer — it is ONLY used here and is NOT a general-purpose fertilizer for other steps.

ADD-ONS — recommend alongside the 4-step based on soil data and customer context:
- Grub/insect protection: 0-0-7 .067 Acelepryn (SKU 115084) — season-long control of grubs, armyworms, fleas, and ants. Recommend whenever customer mentions grubs, insects, or unexplained turf damage.
- Disease/fungicide: Fungicide with Azoxy & PPZ (SKU 115079) — preventative and curative for brown patch, dollar spot, and other diseases. Recommend if customer mentions disease, fungus, or recurring lawn problems.
- Broadleaf spot treatment: Trimec Granular (SKU 115130) — topical broadleaf weed control. Recommend if broadleaf weeds are a concern beyond what Steps 1 and 2 address.
- Lime: Always Solu-Cal per the lime rules below. Lime is an add-on to the 4-step program, not a replacement for any step.

NEW SEEDING / STARTER FERTILIZER EXCEPTION:
If customer mentions new lawn, overseeding, bare spots, or new seeding:
- Skip Step 1 pre-emergent entirely (pre-emergent will prevent seed germination).
- Replace Step 1 with 18-24-12 50% XCU Starter Fertilizer (SKU 115137). Apply per label for new seedings. The heavy phosphorus (24%) promotes strong root development — this is the best option for any lawn establishment situation.
- Always recommend 18-24-12 when phosphorus is low on the soil test AND customer is seeding.

FLEXIBILITY RULES:
- If soil data shows a specific deficiency the standard 4-step doesn't address, note it and add a targeted recommendation alongside the program.
- If customer goals suggest a modification (heavy weed pressure, renovation, sports use), adjust and explain why.
- Always frame the 4-step as the backbone — add-ons and adjustments are layered on top.

PRODUCT QUANTITY CALCULATIONS — FOLLOW EXACTLY:
Get lawn size from customer context. If not provided, assume 5,000 sq ft and state that assumption.
- Step 1 (SKU 115101): bags = lawn sq ft ÷ 12,500, round up to nearest whole bag
- Step 2 (SKU 115100): bags = lawn sq ft ÷ 11,400, round up to nearest whole bag
- Step 3 (SKU 115135): bags = lawn sq ft ÷ 12,500, round up to nearest whole bag
- Step 4 (SKU 115952): bags = lawn sq ft ÷ 12,500, round up to nearest whole bag
- Add-ons: follow label rate; express as whole bags in the product list
Express all quantities as "X bag(s)" — never as bags per 1,000 sq ft.

LIME RATES AND LANGUAGE — CRITICAL RULES:
- The maximum Solu-Cal rate is 12.5 lbs per 1,000 sq ft per application.
- Never state a total lime rate higher than 12.5 lbs per 1,000 sq ft in a single sentence.
- If more lime is needed, always express it as: "X applications of 12.5 lbs per 1,000 sq ft spaced 8 weeks apart."
- Maximum 3 applications per year. If more than 3 are needed, continue into the following year.
- One 50 lb bag covers 4,000 sq ft at the raise rate (12.5 lbs/1,000 sq ft).

LIME SELECTION — FOLLOW THESE RULES EXACTLY:
Always recommend Solu-Cal over standard pelletized or pulverized lime for residential customers.
- Low pH + Mg below 80 ppm OR %Mg below 12% → Solu-Cal Magnesium Pelletized Lime (SKU 11110513)
- Low pH + Mg adequate → Solu-Cal Hi Cal Calcium Pelletized Lime (SKU 11110512)
- Low pH + Organic Matter below 2.5% → Solu-Cal Humic Plus (SKU 1103740)
- Low pH + compaction or water infiltration issues → Solu-Cal Aqua Ca Humic Plus (SKU 11111035)
In the limeStrategy field: name the specific Solu-Cal product and SKU, explain why it works faster than traditional lime (same-season results vs. 10–18 months for standard lime), state the number of applications as "X applications of 12.5 lbs per 1,000 sq ft spaced 8 weeks apart", give the exact total bag count for the full lawn, and note if the schedule runs into the following year.

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
  // ── 4-step core ───────────────────────────────────────────────────────────
  "115101",   // Step 1 — 18-0-4 25% PCU .38 Prodiamine — early spring pre-emergent
  "115100",   // Step 2 — 19-0-6 Lockup .17 Dimension — mid-spring weed control
  "115135",   // Step 3 — 22-0-14 50% XCU with 5% Iron — late summer green-up
  "115952",   // Step 4 — 32-0-6 30% XCU — fall winterizer
  // ── seeding exception ─────────────────────────────────────────────────────
  "115137",   // 18-24-12 50% XCU Starter — replaces Step 1 when overseeding
  // ── add-ons ───────────────────────────────────────────────────────────────
  "115084",   // 0-0-7 .067 Acelepryn — grub/insect control add-on
  "115079",   // Fungicide with Azoxy & PPZ — disease control add-on
  "115130",   // Trimec Granular — broadleaf spot treatment add-on
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
