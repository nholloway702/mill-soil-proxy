// The Mill of Bel Air — official product catalog
// Used by the proxy to constrain Claude's recommendations to stocked products.

export const CATALOG = [
  // ── Grass Seed: Sun & General Turf ─────────────────────────────────────────
  { name: "The Mill 3-Way Tall Fescue Blend",  sku: "62024",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "Premium blend of three elite tall fescue varieties; heat- and drought-tolerant" },
  { name: "The Mill Athletic Mix",              sku: "62015",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "High-traffic sports turf blend of tall fescue and perennial ryegrass" },
  { name: "The Mill Double Coverage Mix",       sku: "62016",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "Dense-seeding mix for overseeding thin lawns; tall fescue base" },
  { name: "SHA Turfgrass",                      sku: "62100",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "State Highway Administration approved turfgrass mix" },
  { name: "The Mill Landscaper Mix",            sku: "62031",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "Professional-grade tall fescue blend for landscape contractors" },
  { name: "The Mill Builders Mix",              sku: "62019",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "Tough all-purpose mix for new construction sites" },
  { name: "The Mill Contractors Mix",           sku: "62030",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "Fast-establishing mix for contractor and re-establishment projects" },
  { name: "Kentucky 31 Tall Fescue",            sku: "62040",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "Classic endophyte-enhanced K-31 tall fescue; excellent persistence" },
  { name: "The Mill Triplex Perennial Ryegrass",sku: "62054",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "Three-way perennial ryegrass blend; rapid germination for overseeding" },
  { name: "The Mill Kentucky Bluegrass",        sku: "62070",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "Self-repairing Kentucky bluegrass blend for premium lawns" },
  { name: "Opulence Kentucky Bluegrass",        sku: "62073",      weight: "50lb", category: "Grass Seed – Sun & General Turf",  description: "Elite Kentucky bluegrass variety with exceptional color and density" },

  // ── Grass Seed: Shade & Slope ───────────────────────────────────────────────
  { name: "The Mill Sun & Shade Mix",           sku: "62020",      weight: "50lb", category: "Grass Seed – Shade & Slope",       description: "Versatile mix of fine fescues and tall fescue for variable light conditions" },
  { name: "The Mill Dense Shade",               sku: "62017",      weight: "50lb", category: "Grass Seed – Shade & Slope",       description: "Fine fescue blend optimized for heavy shade under trees" },
  { name: "Creeping Red Fescue",                sku: "62021",      weight: "50lb", category: "Grass Seed – Shade & Slope",       description: "Low-maintenance fine fescue; spreads by rhizomes; shade and slope use" },
  { name: "Chewings Fescue",                    sku: "61995",      weight: "50lb", category: "Grass Seed – Shade & Slope",       description: "Fine fescue for dry shade, low fertility soils, and steep slopes" },
  { name: "Hard Fescue",                        sku: "61994",      weight: "50lb", category: "Grass Seed – Shade & Slope",       description: "Very low-maintenance fine fescue; drought tolerant; low-input slopes" },

  // ── Grass Seed: Erosion Control ─────────────────────────────────────────────
  { name: "The Mill Temp/Erosion Control",      sku: "62029",      weight: "50lb", category: "Grass Seed – Erosion Control",     description: "Fast-cover temporary mix for erosion control on disturbed soils" },
  { name: "SHA Temporary",                      sku: "62102",      weight: "50lb", category: "Grass Seed – Erosion Control",     description: "SHA-approved temporary stabilization seed mix" },
  { name: "Annual Ryegrass",                    sku: "62060",      weight: "50lb", category: "Grass Seed – Erosion Control",     description: "Rapid-germinating annual cover crop; winter erosion control" },
  { name: "Foxtail Millet",                     sku: "61773",      weight: "50lb", category: "Grass Seed – Erosion Control",     description: "Warm-season annual cover crop; summer erosion control and wildlife forage" },
  { name: "Rye VNS",                            sku: "30129",      weight: "50lb", category: "Grass Seed – Erosion Control",     description: "Winter rye cover crop; fast ground cover, erosion control, and organic matter" },
  { name: "Oats VNS",                           sku: "38112BAG",   weight: "50lb", category: "Grass Seed – Erosion Control",     description: "Spring oat cover crop; quick establishment for temporary cover" },

  // ── Grass Seed: Pasture ─────────────────────────────────────────────────────
  { name: "Horse and Livestock Pasture Mix",    sku: "36170",      weight: "50lb", category: "Grass Seed – Pasture",            description: "Endophyte-free pasture mix of tall fescue, orchardgrass, and clover; safe for horses" },
  { name: "Duragraze Pasture Mix",              sku: "36171",      weight: "50lb", category: "Grass Seed – Pasture",            description: "High-yield grazing mix with orchardgrass, legumes, and perennial ryegrass" },
  { name: "Supreme Pasture Mix",                sku: "36172",      weight: "50lb", category: "Grass Seed – Pasture",            description: "Premium blend for hay and grazing with high palatability species" },

  // ── Granular Fertilizers ────────────────────────────────────────────────────
  { name: "18-24-12 50% XCU Starter Fertilizer",     sku: "115137",    weight: "50lb", category: "Granular Fertilizer", description: "High-phosphorus starter fertilizer with 50% extended-release nitrogen; new seedings" },
  { name: "22-0-14 50% XCU with 5% Iron",             sku: "115135",    weight: "50lb", category: "Granular Fertilizer", description: "Nitrogen and potassium maintenance blend with iron; color and stress tolerance" },
  { name: "32-0-6 30% XCU",                           sku: "115952",    weight: "50lb", category: "Granular Fertilizer", description: "High-N maintenance fertilizer with slow-release; summer feeding" },
  { name: "19-0-10 20% XCU 13% CA 2% FE",             sku: "115110",    weight: "50lb", category: "Granular Fertilizer", description: "N-K blend with calcium and iron; builds root strength and color" },
  { name: "Solu-Cal 6-12-6",                          sku: "11110517",  weight: "50lb", category: "Granular Fertilizer", description: "Balanced starter fertilizer with Solu-Cal calcium; stimulates root development" },
  { name: "20-16-12 83% UF MAP SOP",                  sku: "115143",    weight: "50lb", category: "Granular Fertilizer", description: "Premium balanced NPK with ureaformaldehyde and sulfate of potash" },
  { name: "19-19-19",                                 sku: "115156",    weight: "50lb", category: "Granular Fertilizer", description: "Balanced triple-19 all-purpose fertilizer; lawns, gardens, and field crops" },
  { name: "18-18-18",                                 sku: "115148",    weight: "50lb", category: "Granular Fertilizer", description: "Balanced NPK fertilizer for general turf and garden applications" },
  { name: "14-14-14 Flowering",                       sku: "115141",    weight: "40lb", category: "Granular Fertilizer", description: "Balanced fertilizer formulated for flowering plants and ornamentals" },
  { name: "37-0-0",                                   sku: "1154219",   weight: "50lb", category: "Granular Fertilizer", description: "High-nitrogen granular urea for rapid green-up; nitrogen deficiency correction" },
  { name: "10-10-10",                                 sku: "115151",    weight: "50lb", category: "Granular Fertilizer", description: "General-purpose balanced fertilizer for lawns and gardens" },
  { name: "10-10-10 Micros",                          sku: "115152",    weight: "50lb", category: "Granular Fertilizer", description: "Balanced NPK with trace micronutrients for complete nutrition" },
  { name: "10-20-20",                                 sku: "115154",    weight: "50lb", category: "Granular Fertilizer", description: "High P and K blend; root development, potassium deficiency, and crop establishment" },
  { name: "20-10-10",                                 sku: "115155",    weight: "50lb", category: "Granular Fertilizer", description: "High-nitrogen blend with moderate P and K for nitrogen-deficient soils" },
  { name: "46-0-0 Urea",                              sku: "115158",    weight: "50lb", category: "Granular Fertilizer", description: "Straight nitrogen urea; highest-N granular source for rapid nitrogen correction" },
  { name: "11-52-0 Monoammonium Phosphate",           sku: "1152",      weight: "50lb", category: "Granular Fertilizer", description: "High-phosphorus MAP; corrects severe phosphorus deficiency" },
  { name: "0-45-0 Triple Superphosphate",             sku: "115173",    weight: "50lb", category: "Granular Fertilizer", description: "Concentrated phosphorus source; critical for phosphorus-deficient soils" },
  { name: "0-0-60 Muriate of Potash",                 sku: "115123",    weight: "50lb", category: "Granular Fertilizer", description: "High-analysis potassium (potash); corrects low potassium on most crops" },
  { name: "0-0-50 Sulfate of Potash",                 sku: "1154218",   weight: "50lb", category: "Granular Fertilizer", description: "Chloride-free potassium plus sulfur; preferred for sensitive crops and turf" },

  // ── Organic Fertilizers ─────────────────────────────────────────────────────
  { name: "6-4-0 Milorganite",                  sku: "10234071",  weight: "32lb", category: "Organic Fertilizer",  description: "Biosolid organic fertilizer with slow-release iron; safe, odor-free lawn feeding" },
  { name: "Nature Safe 13-00-00 OMRI",          sku: "1084471",   weight: "50lb", category: "Organic Fertilizer",  description: "OMRI-listed high-nitrogen organic fertilizer from feather meal" },
  { name: "Nature Safe 08-05-05 OMRI",          sku: "1084474",   weight: "50lb", category: "Organic Fertilizer",  description: "OMRI-listed balanced organic NPK from meat and bone meal" },
  { name: "Nature Safe 10-02-08 OMRI",          sku: "1084476",   weight: "50lb", category: "Organic Fertilizer",  description: "OMRI-listed organic blend for nitrogen and potassium needs" },
  { name: "Holly-Tone",                         sku: "1078662",   weight: "50lb", category: "Organic Fertilizer",  description: "Organic acid-forming fertilizer for azaleas, hollies, and acid-loving plants" },

  // ── Liquid Fertilizer & Micronutrients ─────────────────────────────────────
  { name: "Ferti-Rain 12-3-3 with Iron",        sku: "1037466",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Liquid N-P-K with chelated iron; quick green-up and color response" },
  { name: "High NRG N",                         sku: "1000159",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "High-efficiency liquid nitrogen with slow-release component" },
  { name: "Lawn Enhancer 27-0-0-1S",            sku: "1000161",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Liquid high-nitrogen with sulfur; rapid nitrogen correction for turf" },
  { name: "Micro 500",                          sku: "1000170",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Complete micronutrient package; corrects trace element deficiencies" },
  { name: "Pro Germ",                           sku: "1022055",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Liquid germination stimulant with phosphorus and micronutrients for new seedings" },
  { name: "Enhance 7-0-0 with 9% Sulfur",       sku: "1022065",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Nitrogen and sulfur liquid; corrects sulfur deficiency and lowers high-pH soils" },
  { name: "Sure K",                             sku: "1024227",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Liquid potassium source; fast-acting potassium correction" },
  { name: "Liberate Ca",                        sku: "1029958",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Liquid calcium with organic acids; improves Ca availability in high-pH soils" },
  { name: "Manganese",                          sku: "1036394",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Liquid chelated manganese; corrects manganese deficiency" },
  { name: "Access S",                           sku: "1055636",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Liquid sulfur solution; corrects sulfur deficiency in soils and turf" },
  { name: "Liquid Iron",                        sku: "1062880",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Chelated liquid iron; corrects iron chlorosis and improves turf color" },
  { name: "Dynaflow",                           sku: "1202496",   weight: "2.5gal", category: "Liquid Fertilizer & Micronutrients", description: "Liquid biostimulant with humic acids and micronutrients for soil health" },

  // ── Lime & Soil Conditioners ────────────────────────────────────────────────
  { name: "Pelletized Lime",                    sku: "10237218",  weight: "40lb", category: "Lime & Soil Conditioners", description: "Standard calcitic pelletized lime; raises soil pH; easy spreader application" },
  { name: "Hi Calcium Pelletized Lime",         sku: "115206",    weight: "50lb", category: "Lime & Soil Conditioners", description: "High-purity calcium pelletized lime; ideal when Mg is adequate or high" },
  { name: "Dolomitic Pelletized Lime",          sku: "1158240",   weight: "50lb", category: "Lime & Soil Conditioners", description: "Dolomitic lime pellets supplying both Ca and Mg; use when Mg is low" },
  { name: "Hi Calcium Pulverized Lime",         sku: "54055029",  weight: "50lb", category: "Lime & Soil Conditioners", description: "Fast-acting pulverized calcitic lime; quickest pH correction" },
  { name: "Dolomitic Ground Limestone",         sku: "115200",    weight: "50lb", category: "Lime & Soil Conditioners", description: "Ground dolomitic limestone supplying Ca and Mg; use when Mg is deficient" },
  { name: "Solu-Cal Hi Cal Calcium Pelletized Lime",   sku: "11110512", weight: "50lb", category: "Lime & Soil Conditioners", description: "Enhanced solubility calcitic lime; faster pH response than standard pelletized" },
  { name: "Solu-Cal Magnesium Pelletized Lime", sku: "11110513",  weight: "50lb", category: "Lime & Soil Conditioners", description: "Enhanced solubility dolomitic lime with magnesium; corrects low Mg and low pH" },
  { name: "Solu-Cal Humic Plus",                sku: "1103740",   weight: "50lb", category: "Lime & Soil Conditioners", description: "Pelletized lime with humic acid; pH correction plus soil biology stimulation" },
  { name: "Solu-Cal Aqua Ca Humic Plus",        sku: "11111035",  weight: "50lb", category: "Lime & Soil Conditioners", description: "Liquid-enhanced calcium pellets with humic acids for superior Ca availability" },
  { name: "Gypsum",                             sku: "115204",    weight: "50lb", category: "Lime & Soil Conditioners", description: "Calcium sulfate; improves soil structure, adds Ca and S without raising pH" },
  { name: "Gypsum Mini",                        sku: "115213",    weight: "50lb", category: "Lime & Soil Conditioners", description: "Fine-particle gypsum; faster Ca and sulfur availability for compacted soils" },

  // ── Granular Broadleaf Weed Control ────────────────────────────────────────
  { name: "25-0-5 with Trimec & 40% Slow-Release", sku: "115121", weight: "50lb", category: "Granular Broadleaf Weed Control", description: "Fertilizer + Trimec broadleaf herbicide; feeds and controls dandelion, clover, and more" },
  { name: "0-0-7 with LockUp",                  sku: "115094",    weight: "40lb", category: "Granular Broadleaf Weed Control", description: "Potassium with LockUp (fluroxypyr) for tough broadleaf weeds including oxalis" },
  { name: "Trimec Granular",                    sku: "115130",    weight: "20lb", category: "Granular Broadleaf Weed Control", description: "Three-way broadleaf herbicide granules; controls over 200 broadleaf weeds" },
  { name: "Vexis",                              sku: "1285534",   weight: "2lb",  category: "Granular Broadleaf Weed Control", description: "Granular nutsedge and broadleaf weed control for warm- and cool-season turf" },

  // ── Pre-Emergent ────────────────────────────────────────────────────────────
  { name: "18-0-4 25% PCU with 0.38% Prodiamine",   sku: "115101", weight: "50lb", category: "Pre-Emergent", description: "Fertilizer + prodiamine pre-emergent; prevents crabgrass and summer annuals" },
  { name: "0-0-7 with 0.38% Prodiamine",             sku: "115099", weight: "50lb", category: "Pre-Emergent", description: "Prodiamine pre-emergent with potassium carrier; crabgrass prevention" },
  { name: ".58 Prodiamine",                          sku: "115108", weight: "40lb", category: "Pre-Emergent", description: "High-rate prodiamine granular; extended crabgrass and annual grass control" },
  { name: "16-0-5 with 0.15% Dimension",             sku: "115102", weight: "50lb", category: "Pre-Emergent", description: "Fertilizer + Dimension (dithiopyr); pre- and early post-emergent crabgrass control" },
  { name: "13-0-5 with 0.15% Dimension 30% slow-release", sku: "115088", weight: "50lb", category: "Pre-Emergent", description: "Slow-release fertilizer + Dimension; season-long crabgrass control" },
  { name: "21-22-4 .08 Mesotrione Can Seed",         sku: "115111", weight: "40lb", category: "Pre-Emergent", description: "Fertilizer + mesotrione; controls crabgrass while seeding tall fescue" },
  { name: "20-0-4 Mesotrione Can Seed",              sku: "115081", weight: "40lb", category: "Pre-Emergent", description: "Mesotrione pre-emergent that allows overseeding tall fescue simultaneously" },
  { name: "Snapshot",                               sku: "62719",  weight: "50lb", category: "Pre-Emergent", description: "Long-residual pre-emergent for ornamental beds; controls grasses and broadleaves" },
  { name: "Crew",                                    sku: "62721",  weight: "50lb", category: "Pre-Emergent", description: "Granular pre-emergent for turf and ornamentals; broad-spectrum weed prevention" },

  // ── Liquid Weed Control ─────────────────────────────────────────────────────
  { name: "41% Glyphosate",                     sku: "11108903",  weight: "2.5gal", category: "Liquid Weed Control", description: "Non-selective herbicide; total vegetation kill for renovation or hardscapes" },
  { name: "Trimec Classic",                     sku: "1528",      weight: "2.5gal", category: "Liquid Weed Control", description: "Three-way liquid broadleaf herbicide; controls dandelion, chickweed, clover, and more" },
  { name: "T-Zone",                             sku: "1090150",   weight: "2.5gal", category: "Liquid Weed Control", description: "Liquid broadleaf herbicide with sulfentrazone; controls hard-to-kill weeds" },
  { name: "Q4",                                 sku: "1023108",   weight: "2.5gal", category: "Liquid Weed Control", description: "Four-way broadleaf + nutsedge liquid herbicide for fine turf" },

  // ── Combination Products ────────────────────────────────────────────────────
  { name: "19-0-6 Lockup .17 Dimension",        sku: "115100",    weight: "50lb", category: "Combination Products", description: "Fertilizer + LockUp + Dimension; feeds, controls broadleaves, and prevents crabgrass" },
  { name: "13-0-5 Acelepryn/Dimension",         sku: "115088",    weight: "50lb", category: "Combination Products", description: "Fertilizer + Acelepryn insecticide + Dimension pre-emergent; grub, insect, and crabgrass control" },

  // ── Grub & Insect Control ───────────────────────────────────────────────────
  { name: "15-0-5 .067 Acelepryn",              sku: "115114",    weight: "50lb", category: "Grub & Insect Control", description: "Fertilizer + Acelepryn; season-long grub and surface insect control" },
  { name: "0-0-7 .067 Acelepryn",               sku: "115084",    weight: "50lb", category: "Grub & Insect Control", description: "Potassium carrier + Acelepryn; grub and insect control without added N" },
  { name: "Dylox",                              sku: "115127",    weight: "30lb", category: "Grub & Insect Control", description: "Fast-acting granular trichlorfon; curative grub control for active infestations" },
  { name: "GrubEx",                             sku: "99605",     weight: "14.35lb", category: "Grub & Insect Control", description: "Preventive granular grub control with chlorantraniliprole; apply spring" },
  { name: "Bifen",                              sku: "1099074",   weight: "1gal", category: "Grub & Insect Control",  description: "Liquid bifenthrin broad-spectrum insecticide for surface and soil insects" },

  // ── Turf Fungicides ─────────────────────────────────────────────────────────
  { name: "Fungicide with Azoxy & PPZ",         sku: "115079",    weight: "30lb", category: "Turf Fungicides", description: "Granular azoxystrobin + propiconazole; broad-spectrum preventive and curative fungicide" },
  { name: "Propiconazole",                      sku: "1229446",   weight: "2.5gal", category: "Turf Fungicides", description: "Liquid systemic fungicide for dollar spot, brown patch, and leaf diseases" },
  { name: "AzoxyStar",                          sku: "1293202",   weight: "2.5gal", category: "Turf Fungicides", description: "Liquid azoxystrobin; broad-spectrum preventive fungicide for turf diseases" },
  { name: "Chlorothalonil",                     sku: "1243276",   weight: "2.5gal", category: "Turf Fungicides", description: "Liquid contact fungicide; preventive control of dollar spot, brown patch, and leaf spot" },
  { name: "Fungi-Phite",                        sku: "1186928",   weight: "2.5gal", category: "Turf Fungicides", description: "Phosphite-based systemic fungicide and plant activator; Pythium and downy mildew control" },

  // ── Plant Probiotics ────────────────────────────────────────────────────────
  { name: "Bio 800",                            sku: "1292490",   weight: "1gal",   category: "Plant Probiotics", description: "Liquid microbial inoculant with beneficial bacteria; improves nutrient cycling" },
  { name: "Bio 800 Turf",                       sku: "1242516",   weight: "2.5gal", category: "Plant Probiotics", description: "Turf-formulated microbial blend; enhances soil biology and root health" },

  // ── Soil Amendments ─────────────────────────────────────────────────────────
  { name: "Peat Moss 3.8CF",                    sku: "44013",     weight: "3.8cf",  category: "Soil Amendments", description: "Sphagnum peat moss; improves soil structure, water retention, and lowers pH" },
  { name: "Leafgro",                            sku: "44030",     weight: "1.5cf",  category: "Soil Amendments", description: "WSSC composted leaf and yard waste; improves organic matter and soil tilth" },
];

/** Formatted text block for injection into Claude's system prompt */
export const CATALOG_PROMPT_TEXT = (() => {
  const byCategory = CATALOG.reduce((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  return Object.entries(byCategory)
    .map(([cat, products]) => {
      const lines = products.map(p => `  • ${p.name} (SKU: ${p.sku}, ${p.weight}) — ${p.description}`);
      return `${cat}:\n${lines.join("\n")}`;
    })
    .join("\n\n");
})();
