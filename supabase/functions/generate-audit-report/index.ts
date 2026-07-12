// supabase/functions/generate-audit-report/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { requireTenantAccess } from '../_shared/auth.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const tenantId = String(body.tenant_id || "").trim();
    const report_type = body.report_type || 'revenue_recovery_summary';

    const access = await requireTenantAccess(req, tenantId, "auditor");
    if (access instanceof Response) return access;

    const { supabase } = access;

    let title = "Control Gate Report";
    let htmlContent = "";

    switch (report_type) {
      case 'revenue_recovery_summary':
        const { data: summary } = await supabase.from('revenue_recovery_summary').select('*').eq('tenant_id', tenantId).maybeSingle();
        title = "Revenue Recovery Summary";
        htmlContent = `
          <h2>Revenue Recovery Summary</h2>
          <div class="card">${summary ? `<pre>${JSON.stringify(summary, null, 2)}</pre>` : '<p>No data available</p>'}</div>
        `;
        break;

      case 'product_performance':
        const { data: products } = await supabase.from('product_recovery').select('*').eq('tenant_id', tenantId);
        title = "Product Performance & Leakage";
        htmlContent = `
          <h2>Product Performance & Recovery</h2>
          <div class="card">${products ? `<pre>${JSON.stringify(products, null, 2)}</pre>` : '<p>No data available</p>'}</div>
        `;
        break;

      case 'back_audit_findings':
        title = "Back Audit Findings";
        htmlContent = `<h2>Back Audit Findings</h2><p>Historical discrepancies and resolved cases will be displayed here.</p>`;
        break;

      case 'net_revenue_recovery':
        title = "Net Revenue Recovery";
        htmlContent = `<h2>Net Revenue Recovery (Gross vs Recovery Cost)</h2><p>Detailed gross vs net analysis coming soon.</p>`;
        break;

      case 'loss_category_analysis':
        const { data: categories } = await supabase.from('loss_category_analysis').select('*').eq('tenant_id', tenantId);
        title = "Loss Category Analysis";
        htmlContent = `
          <h2>Loss Category Analysis</h2>
          <div class="card">${categories ? `<pre>${JSON.stringify(categories, null, 2)}</pre>` : '<p>No data available</p>'}</div>
        `;
        break;

      default:
        title = "Control Gate Audit Report";
        htmlContent = `<p>Unknown report type: ${report_type}</p>`;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Control Gate</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { 
            font-family: 'Inter', system-ui, sans-serif; 
            margin: 0; padding: 40px; 
            background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%); 
          }
          .container { 
            max-width: 1100px; margin: 0 auto; 
            background: white; border-radius: 16px; 
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); 
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(90deg, #1e2937, #334155); 
            color: white; padding: 40px; text-align: center; 
          }
          .content { padding: 40px; }
          h1 { margin: 0; font-size: 2.5rem; }
          .card { 
            background: #f8fafc; padding: 24px; 
            border-radius: 12px; margin: 20px 0; 
          }
          pre { 
            background: #f1f5f9; padding: 20px; 
            border-radius: 8px; overflow: auto; font-size: 0.9rem; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Control Gate</h1>
            <p>${title}</p>
            <p>Generated on ${new Date().toLocaleString('en-GB')}</p>
          </div>
          <div class="content">
            ${htmlContent}
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(
      JSON.stringify({ success: true, html, report_type }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Report Generation Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});