const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('leads').select('id, status, metadata').limit(3);
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}
check();
