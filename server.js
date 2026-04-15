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
- All rates expressed in lbs per acre only.
- Program follows a two-pass spring/fall structure for Mid-Atlantic pasture management.
- Zones may represent different fields with different intended uses (hay, grazing, clover, alfalfa) — treat each field/zone independently.
- Read the "Type of livestock" field from the customer context and tailor ALL recommendations, safety flags, nitrogen targets, potassium product selection, and customer notes to the specific animals on this property.
- If context mentions multiple species, apply the most conservative safety flags from all species present.
- Always flag elevated nitrates as a concern for ALL livestock species.
- Tone by species: horses → warm, personal, horse-owner focused; cattle → professional, production-focused; sheep/goats → practical, small-operation friendly; mixed → balanced, acknowledge the complexity.`,

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

// ─── equine: pasture program ──────────────────────────────────────────────────

const EQUINE_PASTURE_PROGRAM = `

Only recommend products from the catalog at the bottom of these instructions. Do not reference or suggest any products outside this list. Always include the exact product name AND SKU in every recommendation. Only use "consult Mill staff for product and pricing" if a genuinely needed product is not in the catalog.

MID-ATLANTIC PASTURE FERTILITY PROGRAM — EQUINE & LIVESTOCK:

STEP 1 — IDENTIFY LIVESTOCK TYPE:
Read the "Type of livestock" field in the customer context. Use it to select the correct safety flags, nitrogen targets, potassium product, and customer note tone from the species-specific rules below. If multiple species are listed, apply the most conservative rules from all species present.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HORSES — rules when horses are present:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Nitrogen target: 80–120 lbs N/acre/year. Do NOT recommend 46-0-0 Urea (SKU 115158) on horse pastures — horses are sensitive to non-protein nitrogen sources. Use 32-0-6 30% XCU (SKU 115952) or a balanced product instead.
- Potassium: always use 0-0-50 Sulfate of Potash (SKU 1154218) — lower salt index, gentler on forage quality. Do not use Muriate of Potash on horse pastures.
- Safety flags to include in key findings:
  • Potassium Very High (VH) → "Note: Very high potassium levels have been associated with HYPP in horses with that genetic condition. Monitor horses grazing this field, particularly Quarter Horses or their crosses."
  • Elevated Nitrate Nitrogen → "Note: Elevated nitrate levels can be toxic to horses and livestock. Do not graze or feed hay from this field until nitrates are tested at safe levels."
  • Elevated Sodium (Na) → "Note: Elevated sodium levels detected. Ensure fresh water is always available at all times."
- Always include in customer notes: "Consult your veterinarian before making significant changes to pasture management if horses show signs of sensitivity."
- Tone: warm, personal, horse-owner focused. Emphasize forage quality, palatability, and the connection between pasture health and horse health.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATTLE — rules when cattle are present:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Nitrogen target: 100–150 lbs N/acre/year. Cattle can handle more aggressive fertility programs. 46-0-0 Urea (SKU 115158) is acceptable for cattle pastures operated by experienced managers.
- Potassium: 0-0-60 Muriate of Potash (SKU 115123) is acceptable for cattle pastures.
- Safety flags to include in key findings:
  • Potassium High (H) or Very High (VH) → "Note: High potassium can interfere with magnesium absorption in cattle, increasing the risk of grass tetany. Consider magnesium supplementation in the mineral program, especially in spring."
  • Magnesium Low → "Note: Low magnesium increases grass tetany risk in cattle, especially in lactating cows during spring. Recommend magnesium supplementation in the mineral program."
  • Elevated Nitrate Nitrogen → "Note: Elevated nitrate levels can be toxic to cattle and livestock. Do not graze or feed hay from this field until nitrates are tested at safe levels."
- Tone: professional, production-focused. Reference forage quality, tonnage, and stand productivity. Written like advice from an agronomist, not a pet owner.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHEEP — rules when sheep are present:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Nitrogen target: 60–100 lbs N/acre/year. Conservative rates — sheep graze close and forage quality matters more than tonnage.
- Do NOT recommend any fertilizer product that contains copper for sheep pastures.
- Safety flags to include in key findings:
  • Copper High or Very High → "Note: Sheep are extremely sensitive to copper toxicity. Do not apply copper-containing fertilizers or supplements to sheep pastures. Review all mineral programs with your veterinarian immediately."
  • Magnesium Low → "Note: Low magnesium increases grass tetany risk, especially in ewes during spring. Recommend magnesium supplementation in the mineral program."
  • Elevated Nitrate Nitrogen → "Note: Elevated nitrate levels can be toxic to sheep. Do not graze or feed hay from this field until nitrates are tested at safe levels."
- Tone: practical, small-operation friendly. Straightforward recommendations without overly technical language.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOATS — rules when goats are present:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Nitrogen target: 60–90 lbs N/acre/year. Conservative — goats are hardy and often do well on lower-input programs.
- Do NOT recommend any fertilizer product that contains copper for goat pastures (same copper sensitivity as sheep).
- Safety flags to include in key findings:
  • Copper High or Very High → "Note: Goats are extremely sensitive to copper toxicity. Do not apply copper-containing fertilizers or supplements to goat pastures. Review all mineral programs with your veterinarian immediately."
  • Elevated Nitrate Nitrogen → "Note: Elevated nitrate levels can be toxic to goats. Do not graze or feed hay from this field until nitrates are tested at safe levels."
- Note in program: Goats are browsers, not grazers — pasture renovation may have limited impact compared to cattle or horse operations. Focus on weed suppression and stand quality over density.
- Tone: practical, small-operation friendly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MIXED LIVESTOCK — rules when multiple species are listed:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Apply the most conservative safety flags from ALL species present.
- If sheep or goats are present → always flag copper toxicity risk regardless of copper levels.
- If horses are present → always flag potassium/HYPP risk if K is High or Very High.
- If cattle are present alongside horses → note in program that separate mineral programs may be needed.
- Use 0-0-50 Sulfate of Potash if horses are present in the mix, even if cattle are also present.
- Do not use Urea if horses are present in the mix.
- Tone: balanced, acknowledge the complexity of managing multiple species on shared pasture.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NITROGEN RULES (all species):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Use the lab ENR (Estimated Nitrogen Release) value: N to apply = N target − ENR.
- Legume/clover mixes: reduce N to 20–40 lbs N/acre max regardless of species — legumes fix their own nitrogen. Excess N suppresses clover.
- Alfalfa fields: do NOT apply any nitrogen — alfalfa fully fixes its own N. Note this clearly.
- Spring N: apply March–April when grass begins active growth.
- Fall N: apply August–September for fall flush and winter hardiness.

PHOSPHORUS RECOMMENDATIONS (all species):
- Very Low (VL) → apply full lab recommendation (lbs P2O5/acre).
- Low (L) → apply 75% of lab recommendation.
- Medium (M) → maintenance rate only: 20–30 lbs P2O5/acre.
- High (H) or Very High (VH) → do not apply. Note excess in findings.

POTASSIUM RECOMMENDATIONS (all species):
- Very Low (VL) → apply full lab recommendation (lbs K2O/acre).
- Low (L) → apply 75% of lab recommendation.
- Medium (M) → maintenance rate: 40–60 lbs K2O/acre.
- High (H) or Very High (VH) → do not apply. Note excess in findings. Apply species-specific safety flag per rules above.

ELEVATED NITRATES — flag for ALL livestock species:
- Elevated Nitrate Nitrogen on any pasture → always flag regardless of species: "Do not graze or feed hay from this field until nitrates are tested at safe levels."

LIME FOR PASTURE:
- Target pH for horse/grass/cattle/sheep/goat pastures: 6.2–6.8.
- Target pH for alfalfa: 6.8–7.0.
- pH below target → recommend Solu-Cal at 550 lbs/acre to raise pH.
- pH at or above 6.5 for grass pastures → no lime needed; note pH is adequate.
- Express all lime rates in lbs/acre.

SOLU-CAL SELECTION FOR PASTURE:
- Low pH + Mg below 80 ppm or %Mg below 12% → Solu-Cal Magnesium Pelletized Lime (SKU 11110513)
- Low pH + Mg adequate → Solu-Cal Hi Cal Calcium Pelletized Lime (SKU 11110512)
- Low pH + Organic Matter below 2.5% → Solu-Cal Humic Plus (SKU 1103740)
In the limeStrategy field: name the product and SKU, state the per-acre rate (550 lbs/acre to raise, 260 lbs/acre to maintain), and calculate total bags needed for each field's acreage.

FERTILIZER RECOMMENDATIONS — NUTRIENTS ONLY (no specific products):
For the equine/livestock segment, express ALL fertility recommendations as lbs of nutrient per acre, not as specific fertilizer products or SKUs.

In the annualProgram entries, use this format:
- product: "Nitrogen (N)" or "Phosphate (P2O5)" or "Potash (K2O)" or "Sulfur (S)" or "Magnesium (Mg)"
- rate: "X lbs per acre"
- purpose: agronomic explanation based on the soil data (e.g. "Soil nitrogen is below target for grass pasture; ENR of X lbs/acre leaves X lbs/acre to apply")

In the productList entries, use this format:
- product: "Nitrogen (N) — Spring Application" (or Fall, or similar label)
- type: "Nutrient Recommendation"
- estimatedQty: "X lbs/acre" (plus total lbs for stated acreage if acreage is known)
- purpose: brief agronomic explanation

Always add this note in customerNotes:
"Consult your Mill agronomist or staff to select the right fertilizer product to deliver these nutrient recommendations based on your operation, budget, and application equipment."

Also include this note in limeStrategy if fertilizer is also needed:
"Fertilizer product selection for this pasture program should be confirmed with Mill staff based on your equipment and budget."

Do NOT recommend specific fertilizer products, brand names, analysis numbers (e.g. 19-19-19, 32-0-6), or fertilizer SKUs for this segment. Lime and seed products remain as specific Mill products with SKUs.

PASTURE SEED RECOMMENDATIONS:

WHEN TO RECOMMEND SEED:
- Customer mentions thin stand, renovation, new pasture, or bare areas in pasture_condition → always recommend seed.
- pasture_condition says established but thin → use overseeding rate (15–20 lbs/acre).
- pasture_condition says new pasture or renovation → use new seeding rate (25–30 lbs/acre).
- pasture_condition says good established stand with no issues → do not recommend seed unless soil data suggests otherwise.

SEED MIX DECISION TREE — choose the best match:

HORSE AND LIVESTOCK PASTURE MIX (SKU 36170) — 50 lb bag
Contains: 40% Olathe Orchardgrass, 40% Inavale Orchardgrass, 15% Hostyn Festulolium, 5% Balin Kentucky Bluegrass
Recommend when:
- Primary livestock is horses, or forage palatability is the top priority
- Customer wants soft-leaf, highly palatable forage for full-season grazing
- Orchardgrass is preferred or requested
- General horse and livestock operations where forage quality matters most
Selling points: highly palatable soft leaves, durable and hardy, fast establishment, full-season grazing

DURAGRAZE PASTURE MIX (SKU 36171) — 50 lb bag
Contains: 75% Fojtan Festulolium, 20% Hostyn Festulolium, 5% Balin Kentucky Bluegrass
Recommend when:
- Maximum persistence and season length (March–November) is the priority
- Hot, dry summers are a concern and forage must keep producing
- Customer has cattle, sheep, goats, or horses under tough grazing conditions
- High-volume forage production is needed
Selling points: most persistent mix The Mill offers, handles hot dry summers while still producing, works for all livestock species

SUPREME PASTURE MIX (SKU 36172) — 50 lb bag
Contains: 40% Fojtan Festulolium, 30% Echelon Orchardgrass, 25% Hostyn Festulolium, 5% Balin Kentucky Bluegrass
Recommend when:
- Customer has mixed livestock (cattle, sheep, goats, and horses together)
- A premium blend balancing Festulolium persistence and Orchardgrass palatability is desired
- High-quality sod with weed suppression is a priority
Selling points: most resilient and productive blend, palatable for all livestock species, Balin Kentucky Bluegrass minimizes weed pressure

SEEDING RATE AND QUANTITY CALCULATION:
- New pasture seeding: 25–30 lbs/acre → use 27.5 lbs/acre for quantity math
- Overseeding into existing stand: 15–20 lbs/acre → use 17.5 lbs/acre for quantity math
- Total bags needed = (acreage × rate) ÷ 50, round up to nearest whole bag
- Express as: "X bags (50 lb) for X acres at X lbs/acre"

WEED CONTROL:
- Broadleaf weeds mentioned → recommend an appropriate herbicide and always note: "Always verify the herbicide label for livestock grazing restrictions and observe all required withdrawal periods before grazing treated pastures."
- Do not recommend pre-emergent herbicides on actively grazed pastures without a grazing withdrawal note.

SEASONAL PROGRAM STRUCTURE — TWO PASSES:
Pass 1 — Early Spring (March–April):
  Lime (if needed) + spring N application + P/K corrections + seeding if stand renovation is planned

Pass 2 — Late Summer / Early Fall (August–September):
  Fall N top-dress + any remaining P/K corrections + overseeding if needed + lime follow-up if pH still below target

PRODUCT QUANTITY CALCULATIONS:
- Express all quantities in lbs/acre for single-acre rates, plus total product needed for each field's stated acreage.
- If acreage is not provided, state the assumption.
- For bagged products (50 lb bags): total lbs ÷ 50, round up to nearest whole bag.
- Express as: "X lbs/acre — X bags (50 lb) total for X acres."

THE MILL — PASTURE PRODUCT CATALOG:

`;

// ─── equine: catalog SKUs ─────────────────────────────────────────────────────

const EQUINE_CORE_SKUS = new Set([
  // Fertilizer SKUs intentionally excluded — equine segment uses nutrient
  // recommendations (lbs/acre) instead of specific products. Consult Mill staff.
  // ── pasture seed ──────────────────────────────────────────────────────────
  "36170",    // Horse and Livestock Pasture Mix — general horse/livestock
  "36171",    // Duragraze Pasture Mix — high yield / hay
  "36172",    // Supreme Pasture Mix — premium hay and grazing
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

  if (segment === "equine") {
    const limeProducts = CATALOG.filter(p => p.category === "Lime & Soil Conditioners");
    const coreProducts = CATALOG.filter(p => EQUINE_CORE_SKUS.has(p.sku));
    return instructions + EQUINE_PASTURE_PROGRAM + buildCatalogText([...limeProducts, ...coreProducts]);
  }

  // agronomy: segment instructions only, no catalog
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

    const jsonInstruction = `\n\nCRITICAL: You must always return valid JSON only. No markdown, no explanation, no preamble. If the report has multiple fields or crops in a grid/table format, treat each row as a separate zone in the zones array. Never truncate the JSON — if the response would be too long, reduce the detail in customerNotes and limeStrategy but always complete the full JSON structure with all closing brackets and braces.`;

    const fullSystemPrompt = typeof req.body.system === "string"
      ? req.body.system + (addition || "") + jsonInstruction
      : jsonInstruction;

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
        max_tokens: 6000,
      }),
    });

    const envelopeText = await anthropicResponse.text();
    let data;
    try {
      data = JSON.parse(envelopeText);
    } catch (parseErr) {
      console.error("[analyze] Failed to parse Anthropic API envelope:", parseErr.message);
      console.error("[analyze] Envelope preview:", envelopeText.substring(0, 500));
      return res.status(502).json({ error: "Bad response from AI service" });
    }

    const rawText = data.content?.find(b => b.type === "text")?.text ?? "";
    console.log("[analyze] Raw response length:", rawText.length);
    console.log("[analyze] Response preview:", rawText.substring(0, 500));

    if (anthropicResponse.ok && rawText) {
      try {
        JSON.parse(rawText.replace(/```json|```/g, "").trim());
      } catch (jsonErr) {
        console.error("[analyze] AI returned invalid JSON:", jsonErr.message);
        return res.status(422).json({ error: "AI returned invalid JSON", raw: rawText.substring(0, 1000) });
      }
    }

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
