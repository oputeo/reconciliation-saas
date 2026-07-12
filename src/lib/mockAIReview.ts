import { supabase } from './supabase';

export async function generateMockAIReview(data: any) {
  const { product_name, description = '' } = data;

  // Fetch rules from YOUR existing table
  const { data: rules, error } = await supabase
    .from('rules')
    .select('id, name, description, condition, action, priority, tolerance')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) console.error("Failed to load rules:", error);

  // Generate realistic risk score
  const baseScore = 35 + Math.floor(Math.random() * 35); // 35–70
  const failCount = Math.floor((rules?.length || 0) * 0.25); // ~25% fail rate

  const checklist = (rules || []).slice(0, 12).map((rule: any, index: number) => ({
    rule_id: rule.id,
    title: rule.name,
    description: rule.description || rule.condition,
    status: index < failCount ? 'fail' : 'pass',
    notes: index < failCount 
      ? `Potential gap in ${rule.condition?.substring(0, 60)}...` 
      : 'Control verified in PRD',
    priority: rule.priority
  }));

  const riskScore = Math.min(92, baseScore + failCount * 8);

  return {
    risk_score: Math.round(riskScore),
    summary: `Rules Engine + Mock AI Review for ${product_name}. ${failCount} controls require attention before go-live.`,
    recommendation: riskScore < 50 
      ? "✅ Approve for Go-Live" 
      : riskScore < 75 
        ? "⚠️ Approve with Required Fixes" 
        : "⛔ Reject - Major Gaps Found",
    checklist
  };
}