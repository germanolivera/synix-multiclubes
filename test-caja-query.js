import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nbaqvouvvtrigcdlfqlm.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYXF2b3V2dnRyaWdjZGxmcWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDc0OTYsImV4cCI6MjA4NDkyMzQ5Nn0.VU441AuYSH3f91SsvkXe68grctkZKUa0L9g-pW_hFrc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('sesiones')
    .select('id, items:sesion_items(*)')
    .limit(10)

  console.log("Error:", error)
  console.log("Data:", JSON.stringify(data, null, 2))
}

run()
