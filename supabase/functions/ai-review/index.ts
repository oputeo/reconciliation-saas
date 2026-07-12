import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { reviewId, title, product_name, description, prd_url } = await req.json();

  const prompt = `You are a senior Product Auditor at a fintech company like Moniepoint.
Review this product for go-live. Return JSON only.

Product: ${product_name}
Title: ${title}
Description: ${description}
PRD: ${prd_url || 'None'}

Evaluate:
- Reconciliation & settlement controls
- Security & IAM risks
- PCI DSS / regulatory gaps
- Revenue leakage potential

Return: { "risk_score": 0-100, "summary": "concise executive summary", "recommendation": "Approve / Fix / Reject" }`;

  // Grok / xAI (replace with your key)
  const response = await fetch('https://api.x.ai/v1/chat/completions', {  // or OpenAI/Claude endpoint
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('XAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const ai = await response.json();
  const content = ai.choices[0].message.content;

  return new Response(JSON.stringify(JSON.parse(content)), {
    headers: { 'Content-Type': 'application/json' },
  });
});