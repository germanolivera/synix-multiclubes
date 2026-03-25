const url = process.env.VITE_SUPABASE_URL || 'https://nbaqvouvvtrigcdlfqlm.supabase.co'
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYXF2b3V2dnRyaWdjZGxmcWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDc0OTYsImV4cCI6MjA4NDkyMzQ5Nn0.VU441AuYSH3f91SsvkXe68grctkZKUa0L9g-pW_hFrc'

async function checkTable() {
    const res = await fetch(`${url}/rest/v1/sesion_items?select=*&limit=5`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    
    const data = await res.json();
    console.log("sesion_items (raw REST):", JSON.stringify(data, null, 2));
}

checkTable()
