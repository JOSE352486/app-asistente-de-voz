// supabase/functions/get-gemini-response/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

serve(async (req) => {
  try {
    const { message, imageBase64 } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) throw new Error('Gemini API key not found');
    
    const systemPrompt = `Eres un asistente especializado en transporte público y accesibilidad...`; // Tu prompt completo
    
    let parts = [{ text: `${systemPrompt}\n\nUsuario: ${message}` }];
    if (imageBase64) {
      parts = [
        { text: `${systemPrompt}\n\nAnaliza esta imagen y responde: ${message}` },
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
      ];
    }
    
    const requestBody = {
      contents: [{ parts }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    };

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!geminiResponse.ok) throw new Error('Failed to fetch from Gemini API');
    
    const data = await geminiResponse.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) throw new Error('Unexpected API response format');

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' }, status: 500
    });
  }
});