import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages property is required and must be an array');
    }

    // Initialize Supabase Client with Auth Context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      db: { schema: 'multiclubes' }
    });

    // Validate User Token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth Error:", userError);
      throw new Error(`Unauthorized. Error: ${userError?.message || 'Invalid token'}`);
    }

    // Fetch context data (Sedes, Deportes, etc.) to inform the AI about the club context
    const { data: sedes, error: sedesError } = await supabase.from('clubes').select('id, nombre');
    if (sedesError) {
      console.error('Error fetching clubes:', sedesError);
    }
    console.log("5. Fetched sedes:", sedes?.length);

    const systemPrompt = `Eres el Asistente Copiloto Inteligente de Synix Multi-Clubes.
Tu tarea es ayudar a los administradores a gestionar el club respondiendo consultas.
Actualmente estás hablando con un usuario autenticado.
Información de contexto:
- Sedes Activas: ${sedes && sedes.length > 0 ? sedes.map(s => s.nombre).join(', ') : 'Ninguna'}

REGLAS:
1. Responde de forma concisa y profesional.
2. Eres un experto en la gestión de turnos y espacios.`;

    // Initialize Gemini Client
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Trying gemini-2.5-flash as the newest, or gemini-1.5-flash-latest 
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: systemPrompt
    });

    // Formatting messages from OpenAI format to Gemini format
    console.log("6. Sanitizing and formatting chat history...");
    const validHistory = [];
    let expectedRole = 'user';
    const historyMessages = messages.slice(0, -1);

    for (const msg of historyMessages) {
      const geminiRole = msg.role === 'user' ? 'user' : 'model';
      // Gemini strict formatting: starts with 'user', strictly alternates 'user' and 'model'
      if (geminiRole === expectedRole) {
        validHistory.push({ role: geminiRole, parts: [{ text: msg.content }] });
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
    }

    // Ensure history ends with a 'model' response, since the new message is 'user'
    if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
      validHistory.pop();
    }

    const lastUserMessage = messages[messages.length - 1].content;

    const chat = model.startChat({
      history: validHistory,
      generationConfig: {
        temperature: 0.3,
      }
    });

    console.log("7. Sending message to Gemini...");
    const result = await chat.sendMessage(lastUserMessage);
    const responseText = result.response.text();

    console.log("8. Received response from Gemini");
    const reply = { role: 'assistant', content: responseText };

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Agent Error Details:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error', details: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
