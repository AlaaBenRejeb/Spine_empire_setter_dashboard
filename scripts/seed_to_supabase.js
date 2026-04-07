const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function runPrivilegedStartupGuard() {
  const source = fs.readFileSync(__filename, "utf8");
  const inlineCredentialPatterns = [
    /const\s+supabase(Key|ServiceRoleKey)\s*=\s*['"][^'"]+['"]/i,
    /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+['"]/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  ];

  if (inlineCredentialPatterns.some((pattern) => pattern.test(source))) {
    throw new Error("Startup guard blocked execution: inline privileged credentials detected in script source.");
  }

  if (process.argv.some((arg) => arg.includes("SUPABASE_SERVICE_ROLE_KEY=") || arg.includes("service-role"))) {
    throw new Error("Startup guard blocked execution: pass privileged credentials only via environment variables.");
  }
}

runPrivilegedStartupGuard();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const leadsJsonPath = process.env.LEADS_JSON_PATH;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing required env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script."
  );
}

if (!leadsJsonPath) {
  throw new Error(
    "Missing LEADS_JSON_PATH. Provide an external JSON path so runtime never depends on tracked static lead data."
  );
}

const resolvedLeadsPath = path.resolve(leadsJsonPath);
if (!fs.existsSync(resolvedLeadsPath)) {
  throw new Error(`LEADS_JSON_PATH does not exist: ${resolvedLeadsPath}`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedLeads() {
  const leadsRaw = fs.readFileSync(resolvedLeadsPath, "utf8");
  const leadsData = JSON.parse(leadsRaw);

  console.log(`🚀 Starting seed of ${leadsData.length} leads using service-role key from environment...`);

  const transformed = leadsData.map(l => ({
    business_name: l["Practice Name"],
    contact_name: `${l["First Name"]} ${l["Last Name"] || ""}`,
    phone: l.Phone,
    revenue_range: l["Revenue Range"] || "Unknown",
    main_challenge: l["Main Challenge"] || "",
    status: 'new',
    metadata: { 
      email: l.Email, 
      city: l.City, 
      state: l.State,
      google_reviews: l["Google Reviews"]
    }
  }));

  const batchSize = 100;
  for (let i = 0; i < transformed.length; i += batchSize) {
    const batch = transformed.slice(i, i + batchSize);
    const { error } = await supabase.from('leads').insert(batch);
    if (error) console.error(`❌ Batch error ${i}:`, error.message);
    else console.log(`✅ Batch ${i/batchSize + 1} finalized`);
  }
  
  console.log("🎯 Lead seed complete.");
}

seedLeads();
