import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nbaqvouvvtrigcdlfqlm.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYXF2b3V2dnRyaWdjZGxmcWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDc0OTYsImV4cCI6MjA4NDkyMzQ5Nn0.VU441AuYSH3f91SsvkXe68grctkZKUa0L9g-pW_hFrc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch() {
  const { data, error } = await supabase
    .from('sesiones')
    .select('id, articulos:sesion_items(id, nombre, precio, cantidad)')
    .limit(5)
  
  if (error) console.error("Error:", error.message)
  else console.log("Sesiones fetched:", JSON.stringify(data, null, 2))
}

testFetch()
