// supabase/functions/get-directions/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { origin, destination } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!apiKey) throw new Error('Google Maps API key not found');
    if (!origin || !destination) throw new Error('Origin and destination are required');

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=TRANSIT&language=es&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') throw new Error(data.error_message || 'Could not find a route');

    const leg = data.routes[0].legs[0];
    const steps = leg.steps.map((step: any) => ({
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
      detail: `Distancia: ${step.distance.text}`,
      timeRemaining: step.duration.text,
      accessibility: step.transit_details ? `Línea ${step.transit_details.line.name}` : 'Paso a pie'
    }));

    return new Response(JSON.stringify({ steps, totalDuration: leg.duration.text }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' }, status: 400
    });
  }
});