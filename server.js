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

EQUINE/LIVESTOCK SEGMENT OVERRIDE: Regardless of what crop names, field IDs, or intended use labels appear on the lab report (e.g. Corn, Soybean, Alfalfa, Clover), always treat every field as a pasture field for grazing or hay production. Never produce row crop recommendations, never reference bushels per acre yield goals, never recommend row crop fertility programs. The field names on the lab report are simply what the customer named their paddocks — they do not indicate row crop production. Always follow the pasture fertility program: nutrients in lbs/acre, two-pass seasonal structure, pasture seed if needed, horse/livestock safety flags as appropriate.

- All rates expressed in lbs per acre only.
- Program follows a two-pass spring/fall structure for Mid-Atlantic pasture management.
- Zones may represent different fields with different intended uses (hay, grazing, clover, alfalfa) — treat each field/zone independently.
- Read the "Type of livestock" field from the customer context and tailor ALL recommendations, safety flags, nitrogen targets, potassium product selection, and customer notes to the specific animals on this property.
- If context mentions multiple species, apply the most conservative safety flags from all species present.
- Always flag elevated nitrates as a concern for ALL livestock species.
- Tone by species: horses → warm, personal, horse-owner focused; cattle → professional, production-focused; sheep/goats → practical, small-operation friendly; mixed → balanced, acknowledge the complexity.`,

  agronomy: `
SEGMENT: AGRONOMY (Farm / Row Crop)

CRITICAL DATA PARSING RULES FOR WAYPOINT AGRONOMY REPORTS:

The Waypoint agronomy soil analysis table has a specific column order. Read carefully:
- The OM % column appears FIRST on the left side of the data rows
- The Soil pH column appears on the RIGHT side of the same row, near the Buffer Index and Acidity columns
- Do NOT confuse OM % with Soil pH — they are different columns
- Soil pH for corn fields in Maryland typically ranges from 5.5 to 7.5
- Organic Matter % for Maryland corn fields typically ranges from 1.5% to 8%
- If the pH value you are reading is between 1.5 and 8 AND matches the OM value exactly, you are reading the wrong column

The correct column order in the Waypoint agronomy analysis table is:
LEFT SIDE: Sample ID / Field ID | Lab Number | OM % Rate | W/V Soil Class | ENR lbs/A | Phosphorus M3 ppm Rate | Phosphorus ppm Rate | Potassium K ppm Rate | Magnesium Mg ppm Rate | Calcium Ca ppm Rate | Sodium Na ppm Rate
RIGHT SIDE: Soil pH | Buffer Index | Acidity H meq/100g | C.E.C meq/100g

Always read Soil pH from the RIGHT side columns next to Buffer Index — NOT from the OM % column on the left.

For each zone, verify:
- pH should come from the "Soil pH" labeled column on the right side of the table
- OM should come from the "OM %" labeled column on the left side of the table
- These two values will often be numerically similar but are completely different measurements

REPORT READING:
- Always read BOTH the Soil Analysis table AND the Soil Fertility Recommendations table from the PDF.
- The lab's Soil Fertility Recommendations are the primary source of truth for nutrient rates — use them exactly as stated.
- Capture the Farm name and Grower name separately — both appear in the report header.
- The Intended Crop column in the recommendations table is the definitive crop for each field — use it, do not rely on what staff entered in context.
- Yield Goal is stated in the recommendations table — always reference it in the output.
- Lime is expressed in Tons/A in agronomy reports — always use tons/acre not lbs/acre for lime.
- Some fields will have multiple crops listed (e.g. Corn + Triticale, Corn + Wheat) — treat each crop as a separate application in the annual program.

LIME CONVERSION FOR SOLU-CAL (agronomy — tons/acre format):
The mandatory ÷4 conversion rule applies — see SOLU-CAL RATE CALCULATION section.
- Lab tons/acre ÷ 4 = Solu-Cal tons/acre; then × 2,000 = Solu-Cal lbs/acre
- If Mg is also low → recommend Solu-Cal Magnesium Pelletized Lime (SKU 11110513)
- If Mg is adequate → recommend Solu-Cal Hi Cal Calcium Pelletized Lime (SKU 11110512)
- Always state both the lab's traditional rate AND the Solu-Cal equivalent in limeStrategy
- Always note: "Solu-Cal corrects pH in the same growing season vs. 12-18 months for traditional lime"
- If lime rate is 0.0 tons/acre → no lime needed, state pH is adequate

NITROGEN PROGRAM:
- Use the lab's N recommendation exactly.
- For CORN: Split N into pre-plant/at-plant and side-dress applications.
  - At-plant: 30-40 lbs N/acre as starter (if starter fertilizer is used)
  - Side-dress: remainder applied at V4-V6 growth stage
  - Always note: "For high-yield corn (>250 bu/acre goal), consider UAN side-dress application at V5-V6 for maximum efficiency"
- For SOYBEANS: N rate is typically 15 lbs/acre inoculant-based — note importance of rhizobium inoculant.
- For WHEAT/TRITICALE: Split N — apply only 15-20 lbs/acre in fall, remainder in early spring before jointing.
  - Apply sulfur in sulfate form with spring N application (thiosulfate does not count)
- For ORCHARDGRASS/GRASS HAY: Apply 50 lbs N/acre after each cutting.
- For SORGHUM: N is typically 0 due to high soil levels — note if soil test shows adequate.
- For SNAP BEANS: Apply additional 30-50 lbs N/acre after plants reach 2-3 leaf stage through flowering.

PHOSPHORUS:
- Use lab recommendation exactly in lbs P₂O₅/acre.
- When lab comments say "For best results apply 20-40# P2O5 as side placement" — always include this note in the program.
- When P is 0 in lab rec but soil test shows adequate P → note "No additional phosphorus needed based on soil test."

POTASSIUM:
- Use lab recommendation exactly in lbs K₂O/acre.
- When lab comments say "apply 20-30# K2O as side placement" — include this note.

MICRONUTRIENTS — always include if lab recommends them:
- ZINC: "Apply as side-band near crop row for maximum effectiveness. Foliar application for non-row crops."
- SULFUR: "Apply in sulfate form (ammonium sulfate, gypsum). Thiosulfate does not contain sulfate and should not be used as the sole sulfur source."
- BORON: "Apply on broadcast basis. Do not over-apply — boron toxicity can occur at excessive rates."
- MAGNESIUM: "Apply as magnesium oxide, Epsom salts (magnesium sulfate), K-Mag, or Sul-PO-Mag. Do not rely on dolomitic lime alone if immediate correction is needed."

CATION RATIO AND BALANCE ANALYSIS:

For every field, calculate and evaluate the following using values from the soil analysis table:

CA:MG RATIO (Ca ppm / Mg ppm):
- Ideal range: 5:1 to 8:1
- Below 5:1 → Flag warning: "Excess magnesium relative to calcium. Mg saturation is suppressing Ca uptake. Avoid dolomitic lime — use high calcium lime only. Consider gypsum to add Ca without raising pH further."
- Above 8:1 → Flag warning: "Calcium dominance detected. Low Mg relative to Ca may limit magnesium availability. Consider Mg supplementation if lab does not already recommend it."
- Within 5:1–8:1 → Note: "Ca:Mg ratio is within optimal balance."

K:MG RATIO (K ppm / Mg ppm):
- Ideal range: 0.2:1 to 0.3:1
- Above 0.5:1 → Flag warning: "Elevated potassium relative to magnesium. High K suppresses Mg uptake and can increase lodging risk in corn. Apply Mg as recommended and avoid additional K beyond lab recommendation."
- Below 0.2:1 → Flag warning: "Low K relative to Mg. Potassium may be limiting even if absolute K levels appear adequate. Prioritize K application."
- Within 0.2:1–0.5:1 → Note: "K:Mg ratio is balanced."

BASE SATURATION EVALUATION (use %Ca, %Mg, %K from the analysis table):
%Ca target 65–80%:
- Below 65% → Flag warning: "Calcium saturation is low. Prioritize high-calcium lime to improve Ca availability and soil structure."
- Above 80% → Flag warning: "High calcium saturation. Monitor for induced Mg or K deficiency."
%Mg target 10–20%:
- Below 10% → Flag warning: "Magnesium saturation is low. Supplement with Mg even if ppm level appears medium."
- Above 20% → Flag warning: "High magnesium saturation. Excess Mg tightens soil, reduces aeration, and competes with K and Ca uptake. Use calcitic not dolomitic lime."
%K target 2–5%:
- Below 2% → Flag critical: "Potassium saturation is critically low. Apply full K recommendation and consider split application."
- Above 5% → Flag warning: "High K saturation. Excess K suppresses Mg and Ca uptake. Do not apply additional K beyond what is needed."
%H (hydrogen/acidity):
- Above 15% → Flag warning: "High acidity saturation indicates significant lime need. pH correction is the highest priority for this field."
- Above 25% → Flag critical: "Severe acidity. This field has very high lime demand. Multiple Solu-Cal applications may be needed."

CEC EVALUATION:
- Below 8 meq/100g → Flag warning: "Low CEC soil — limited nutrient holding capacity. Split nitrogen into at least 3 applications to reduce leaching losses. Avoid single large N applications. Consider starter + side-dress + late-season foliar approach."
- 8–15 meq/100g → Note: "Moderate CEC — standard split N program appropriate."
- Above 15 meq/100g → Note: "High CEC soil — good nutrient retention. Can support larger single applications if needed."

ORGANIC MATTER EVALUATION:
- Below 2.5% → Flag warning: "Low organic matter — reduced nitrogen efficiency, poor water holding capacity, and lower biological activity. Consider cover crops, reduced tillage, or manure applications to build OM over time."
- 2.5–4% → Note: "Adequate organic matter for Mid-Atlantic soils."
- Above 4% → Note: "Good organic matter — strong nitrogen mineralization potential. ENR credit from lab should be applied to reduce synthetic N inputs."
- Always reference ENR: "Soil organic matter will release approximately [ENR] lbs N/acre this season. This has been credited in the lab's nitrogen recommendation."

AGRONOMIC RISK FLAGS:

Evaluate each field for the following and add relevant items to keyFindings with appropriate severity:

HIGH P + LOW PH: If Phosphorus is rated H or VH AND pH < 6.0 → critical: "High soil phosphorus is largely unavailable at this pH. Phosphorus availability is severely limited below pH 6.0. Lime correction must be the first priority — applied phosphorus will be wasted until pH is corrected."

LOW CEC + HIGH N RATE: If CEC < 8 AND lab N rec > 150 lbs/acre → warning: "Low CEC combined with high nitrogen rate creates significant leaching risk. Split N into minimum 3 passes. Consider slow-release or stabilized nitrogen products to improve efficiency."

SULFUR DEFICIENCY: If lab S > 0 lbs/acre → warning: "Sulfur deficiency detected. Mid-Atlantic soils have declining sulfur levels due to reduced atmospheric deposition. Apply sulfur in sulfate form only — elemental sulfur and thiosulfate are not immediately plant available." / If lab S = 0 but OM < 2.5% and crop is corn or wheat → warning: "Low organic matter fields are at elevated sulfur deficiency risk even without a lab recommendation. Consider 10–15 lbs S/acre as ammonium sulfate as insurance."

BORON DEFICIENCY: If lab Boron is VL or L → warning: "Low boron detected. Boron is critical for corn pollination and kernel set. Apply as broadcast at [lab B rec] lbs/acre. Do not side-band boron — concentrated boron near seed can be toxic."

ZINC DEFICIENCY: If lab Zinc is VL or L → warning: "Low zinc — critical for corn growth especially in cold wet springs. Side-band zinc near the seed row for maximum efficiency. Do not broadcast — zinc has very low soil mobility."

HIGH MANGANESE: If Mn ppm > 200 → warning: "Very high manganese. Excessive Mn can be toxic to crops especially at low pH. Raising pH through lime application will reduce Mn availability and toxicity risk."

LOW OM + HIGH YIELD GOAL: If OM < 2.5% AND yield goal > 200 bu/acre corn or > 50 bu/acre soybeans → warning: "Low organic matter combined with high yield goal increases risk of nitrogen inefficiency and moisture stress. Ensure adequate N split and consider in-season monitoring."

LOW CA SATURATION: If %Ca < 60% → critical: "Low calcium saturation — calcium deficiency risk. Prioritize high-calcium lime application. Low Ca affects soil structure, root development, and crop standability."

HIGH SODIUM: If Na ppm > 50 or %Na > 2% → warning: "Elevated sodium detected. High Na disperses soil aggregates, reduces water infiltration, and can cause crusting. Gypsum (calcium sulfate) application can help displace Na and improve soil structure."

TONE AND FORMAT:
- Write for a farmer audience — professional, direct, agronomically precise.
- Use proper agronomic terminology: side-dress, broadcast, side-band, pre-plant incorporated, V4-V6, jointing, etc.
- Reference yield goals directly: "To achieve your 300 bu/acre yield goal on Field 1..."
- Be concise in customer notes — farmers want facts and recommendations, not explanation.
- Customer notes should read like advice from a trusted agronomist, not a retail store.
- In executiveSummary, lead with the most critical soil chemistry issue identified across all fields.
- In customerNotes, reference specific ratio imbalances using agronomic language appropriate for a farmer.

JSON OUTPUT DIFFERENCES FOR AGRONOMY:

annualProgram — produce one timing group per crop stage (Pre-plant, At-plant, Side-dress, etc.). Each field gets its OWN set of application entries — do not group all fields into a single entry. Each application object must include all of these fields:
  - zone: the field/sample name exactly as it appears in the lab report
  - timing: the crop stage name (e.g. "Pre-plant — March/April")
  - product: nutrient and rate together (e.g. "Nitrogen (N) — 265 lbs/acre" or "Solu-Cal Hi Cal — 500 lbs/acre")
  - rate: the numeric rate with units repeated (e.g. "265 lbs/acre")
  - method: the application method (e.g. "Broadcast and incorporate before planting", "2x2 in-furrow starter", "UAN coulter injection at V4-V6", "Side-band near crop row")
  - notes: any lab-specific comments for this field (e.g. "Lab recommends 20-40 lbs P2O5 as side placement", "Apply sulfur in sulfate form — thiosulfate does not count", "Do not over-apply boron — toxicity risk at excessive rates"). Use empty string if none.

productList for agronomy: list nutrients as lbs/acre (N, P₂O₅, K₂O, etc.) — do NOT recommend specific bagged fertilizer products.

limeStrategy: use Solu-Cal with tons/acre conversion, include both the traditional lime rate from lab and the Solu-Cal equivalent.

executiveSummary: lead with yield goals, most limiting nutrients, and lime status.

customerNotes: professional agronomic tone, reference specific fields by name, mention any lab comments about application method.

ratioAnalysis — include this as a top-level field in the JSON response. One object per field/zone:
  Each object:
  - field: field/sample name
  - caToMg: number (Ca ppm / Mg ppm, rounded to 1 decimal)
  - kToMg: number (K ppm / Mg ppm, rounded to 2 decimals)
  - cecClass: "low" | "moderate" | "high"
  - omClass: "low" | "adequate" | "good"
  - flags: array of strings — one entry per ratio or risk flag triggered for this field (use the flag text from the rules above, concise form)

farmSummaryTable — include this as a top-level field in the JSON response. One row per field/zone, reading values directly from the lab's Soil Fertility Recommendations table:
  headers: ["Field", "Crop", "Yield Goal", "pH", "Lime (tons/acre)", "N (lbs/acre)", "P2O5 (lbs/acre)", "K2O (lbs/acre)", "Mg (lbs/acre)", "S (lbs/acre)", "Zn (lbs/acre)", "B (lbs/acre)", "Notes"]
  Each row object:
  - field: field/sample name from lab
  - crop: intended crop from lab recommendations table
  - yieldGoal: yield goal string from lab recommendations table
  - ph: soil pH as a number (read from the Soil pH column on the RIGHT side of the analysis table)
  - lime: lime recommendation in tons/acre as a number (0 if none)
  - n: N recommendation in lbs/acre as a number
  - p2o5: P2O5 recommendation in lbs/acre as a number
  - k2o: K2O recommendation in lbs/acre as a number
  - mg: Mg recommendation in lbs/acre as a number (0 if none)
  - s: S recommendation in lbs/acre as a number (0 if none)
  - zn: Zn recommendation in lbs/acre as a number (0 if none)
  - b: B recommendation in lbs/acre as a number (0 if none)
  - notes: any lab application comments for this field (side-band placement, sulfur form, boron caution, etc.)`,
};

// ─── Solu-Cal mandatory conversion — injected into every segment's prompt ────────

const SOLU_CAL_MANDATORY_CONVERSION = `

SOLU-CAL RATE CALCULATION — MANDATORY CONVERSION (applies to all segments):

The lab report provides lime recommendations in traditional lime equivalents. Solu-Cal works at EXACTLY 1/4 the rate. You MUST divide by 4 before writing any Solu-Cal rate. Never apply the lab's lime number directly as a Solu-Cal rate.

FOR RESIDENTIAL AND TURF REPORTS (lab rate in lbs per 1,000 sq ft):
Step 1: Read the lab's lime recommendation in lbs per 1,000 sq ft
Step 2: Divide by 4 → this is total Solu-Cal needed in lbs per 1,000 sq ft
Step 3: Split into passes of no more than 12.5 lbs per 1,000 sq ft, spaced 8 weeks apart

Example — lab recommends 80 lbs/1,000 sq ft:
  Solu-Cal total = 80 ÷ 4 = 20 lbs/1,000 sq ft
  → 2 applications of 10 lbs each, 8 weeks apart
  WRONG: "Apply 80 lbs of Solu-Cal" — this is 4× too much

Example — lab recommends 60 lbs/1,000 sq ft:
  Solu-Cal total = 60 ÷ 4 = 15 lbs/1,000 sq ft
  → 1 application of 12.5 lbs + 1 application of 2.5 lbs, 8 weeks apart
  WRONG: "Apply 60 lbs of Solu-Cal"

Example — lab recommends 40 lbs/1,000 sq ft:
  Solu-Cal total = 40 ÷ 4 = 10 lbs/1,000 sq ft
  → Single application of 10 lbs/1,000 sq ft
  WRONG: "Apply 40 lbs of Solu-Cal"

Residential/turf limits: max 12.5 lbs per application · max 3 applications per year · one 50 lb bag covers 4,000 sq ft at full rate

FOR AGRONOMY REPORTS (lab rate in tons per acre):
Step 1: Read the lab's lime recommendation in tons per acre
Step 2: Divide by 4 → Solu-Cal tons per acre
Step 3: Multiply by 2,000 → Solu-Cal lbs per acre
Step 4: Split if total exceeds 500 lbs/acre per application

Example — lab recommends 0.8 tons/acre:
  Solu-Cal = 0.8 ÷ 4 = 0.2 tons/acre = 400 lbs/acre → single pass
  WRONG: "Apply 0.8 tons/acre Solu-Cal" or "Apply 1,600 lbs/acre"

Example — lab recommends 1.3 tons/acre:
  Solu-Cal = 1.3 ÷ 4 = 0.325 tons/acre = 650 lbs/acre
  → Split: 500 lbs/acre + 150 lbs/acre
  WRONG: "Apply 1.3 tons/acre Solu-Cal"

CRITICAL SELF-CHECK: If your Solu-Cal rate equals or nearly equals the lab's traditional lime rate, you have skipped the ÷4 conversion. Recalculate before outputting.`;

// ─── agronomy: crop-specific timing (injected per-request based on detected crop) ──

const AGRONOMY_CROP_TIMING = {
  corn: `APPLICATION TIMING FOR CORN:
- Pre-plant (March-April): Lime, broadcast P and K, zinc if needed
- At-plant: Starter fertilizer (30 lbs N + 20-40 lbs P2O5 + 20-30 lbs K2O as side placement or 2x2)
- Side-dress (V4-V6, late May-June): Remaining N, sulfur if needed`,

  soybean: `APPLICATION TIMING FOR SOYBEANS:
- Pre-plant (April-May): Lime, broadcast P and K
- At-plant: Inoculant, starter P if needed
- No in-season N needed`,

  wheat: `APPLICATION TIMING FOR WINTER WHEAT:
- Fall (September-October): 15-20 lbs N/acre, P and K, lime if needed
- Spring (February-March): Remaining N + sulfur in sulfate form before jointing`,

  triticale: `APPLICATION TIMING FOR TRITICALE:
- Fall (September-October): 15-20 lbs N/acre, P and K, lime if needed
- Spring (February-March): Remaining N + sulfur in sulfate form before jointing`,

  sorghum: `APPLICATION TIMING FOR SORGHUM:
- Pre-plant (May): Lime if needed, P and K if needed
- At-plant: Sulfur and zinc if recommended`,

  snap_bean: `APPLICATION TIMING FOR SNAP BEANS:
- Pre-plant: Lime, P and K
- At-plant: Full N recommendation
- In-season (2-3 leaf stage): Additional 30-50 lbs N/acre through flowering`,

  hay: `APPLICATION TIMING FOR ORCHARDGRASS/GRASS HAY:
- Spring (March-April): Lime if needed, P and K
- After each cutting: 50 lbs N/acre`,
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
The mandatory ÷4 conversion rule applies — see SOLU-CAL RATE CALCULATION section.
Step 1: Read the lab's lime recommendation in lbs per 1,000 sq ft
Step 2: Divide by 4 → total Solu-Cal needed in lbs per 1,000 sq ft
Step 3: Split into passes of no more than 12.5 lbs per 1,000 sq ft, spaced 8 weeks apart
- Maximum 3 applications per year. If more than 3 are needed, continue into the following year.
- One 50 lb bag covers 4,000 sq ft at 12.5 lbs per 1,000 sq ft.
- Never output a Solu-Cal rate equal to the lab's traditional lime rate — that means the ÷4 was skipped.

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

function extractCrop(body) {
  const text = extractContextText(body);
  if (/triticale/i.test(text))                              return "triticale";
  if (/snap\s*bean/i.test(text))                            return "snap_bean";
  if (/sorghum/i.test(text))                                return "sorghum";
  if (/soybean|soy\s*bean/i.test(text))                     return "soybean";
  if (/wheat/i.test(text))                                  return "wheat";
  if (/corn|maize/i.test(text))                             return "corn";
  if (/orchardgrass|orchard\s*grass|hay|grass\s*hay/i.test(text)) return "hay";
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

  // agronomy: segment instructions + crop-specific timing only (no catalog)
  if (segment === "agronomy") {
    const crop = extractCrop(body);
    const timing = crop && AGRONOMY_CROP_TIMING[crop]
      ? `\n\n${AGRONOMY_CROP_TIMING[crop]}`
      : "\n\nAPPLICATION TIMING: Use crop-specific pre-plant, at-plant, and side-dress timing appropriate for the intended crop identified in the lab report.";
    return instructions + timing;
  }

  return instructions;
}

// ─── route ────────────────────────────────────────────────────────────────────

app.post("/api/analyze", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server." });
  }

  const segment = extractSegment(req.body);
  console.log(`[analyze] Request received — segment: ${segment ?? "unknown"}`);

  try {
    const addition = buildSystemAddition(segment, req.body);

    const jsonInstruction = `\n\nCRITICAL: You must always return valid JSON only. No markdown, no explanation, no preamble. If the report has multiple fields or crops in a grid/table format, treat each row as a separate zone in the zones array. Never truncate the JSON — if the response would be too long, reduce the detail in customerNotes and limeStrategy but always complete the full JSON structure with all closing brackets and braces.`;

    const fullSystemPrompt = typeof req.body.system === "string"
      ? req.body.system + (addition || "") + SOLU_CAL_MANDATORY_CONVERSION + jsonInstruction
      : jsonInstruction;

    console.log(`[analyze] System prompt length: ${fullSystemPrompt.length} chars`);
    if (fullSystemPrompt.length > 50000) {
      console.warn(`[analyze] WARNING: System prompt exceeds 50,000 chars (${fullSystemPrompt.length})`);
    }

    // Agronomy reports can have many zones — give them more room
    const maxTokens = segment === "agronomy" ? 8000 : 6000;

    // Only forward fields Anthropic's API accepts — never spread req.body blindly.
    // Spreading req.body would forward unknown fields like selectedStore, causing a 400.
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: req.body.model,
        max_tokens: maxTokens,
        system: fullSystemPrompt,
        messages: req.body.messages,
        stream: false,
      }),
    });

    // Always read the full body first so we can log it on error
    const envelopeText = await anthropicResponse.text();

    if (!anthropicResponse.ok) {
      console.error(`[analyze] Anthropic API error ${anthropicResponse.status}:`, envelopeText.substring(0, 2000));
      let errData = {};
      try { errData = JSON.parse(envelopeText); } catch {}
      return res.status(anthropicResponse.status).json({
        error: errData?.error?.message ?? `Anthropic API error ${anthropicResponse.status}`,
        detail: errData,
      });
    }

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

    if (rawText) {
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
