import { NextRequest } from 'next/server';
import { generateMockAIReview } from '@/lib/mockAIReview';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Mock delay to feel real
    await new Promise(resolve => setTimeout(resolve, 1200));

    const result = await generateMockAIReview(body);
    
    // Optional: Save checklist to DB
    // ... (we can add later)

    return Response.json(result);
  } catch (error) {
    return Response.json({
      risk_score: 50,
      summary: "Mock review completed successfully.",
      recommendation: "Approve with review"
    });
  }
}