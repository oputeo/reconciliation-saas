export type ReviewStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'go_live';

export interface ControlReview {
  id: string;
  title: string;
  product_name: string;
  prd_url?: string;
  description?: string;
  status: ReviewStatus;
  risk_score?: number;
  ai_summary?: string;
  ai_recommendation?: string;
  created_by: string;
  reviewer_id?: string;
  approver_id?: string;
  created_at: string;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  review_id: string;
  rule_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'pass' | 'fail' | 'not_applicable';
  notes?: string;
}

export interface AIRreviewResult {
  risk_score: number;
  summary: string;
  recommendation: string;
  checklist?: Array<{ title: string; status: string; notes: string }>;
}