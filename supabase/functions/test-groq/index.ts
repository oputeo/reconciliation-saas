import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { metric_type, metrics = {}, tenant_id } = body;

    if (!metric_type) {
      throw new Error("metric_type is required");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const value = metrics.value || "Unknown Value";

    const prompt = `
You are a senior fintech auditor.
Analyze this metric professionally and give short, actionable insight.

Metric: ${metric_type}
Value: ${value}

Respond in this exact format:
Analysis: [one clear sentence]
Recommendation: [one actionable suggestion]
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 250,
      }),
    });

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "Analysis not available at the moment.";

    return new Response(
      JSON.stringify({
        success: true,
        analysis: aiText,
        metric_type,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("AI Insight Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to generate insight" 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});