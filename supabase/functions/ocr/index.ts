import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de CORS (preflight request)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { base64Image, mimeType } = body;

    if (!base64Image || !mimeType) {
      throw new Error("base64Image y mimeType son requeridos");
    }

    // 4. Llamar a Gemini API
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno de Edge Functions.");
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const prompt = `Analiza este comprobante (boleta/factura). Extrae los siguientes datos y responde ÚNICAMENTE con un objeto JSON válido (sin formato markdown \`\`\`json) con esta estructura exacta:
    {
      "fecha": "YYYY-MM-DD",
      "monto": número entero (sin puntos ni símbolos),
      "categoria": "Una palabra (ej: Alimentación, Transporte, Alojamiento, Insumos)",
      "descripcion": "Breve descripción del gasto (max 5 palabras)"
    }
    Si no logras encontrar la fecha, usa la de hoy. Si no encuentras el monto, pon 0.`;

    const geminiRequest = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        response_mime_type: "application/json"
      }
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequest),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error("Error en Gemini API: " + JSON.stringify(result));
    }

    // 5. Parsear y retornar respuesta
    let extractedText = result.candidates[0].content.parts[0].text;
    
    // Limpiar posibles backticks markdown en caso de que Gemini los devuelva a pesar de la instrucción
    extractedText = extractedText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsedData = JSON.parse(extractedText);

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
