import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ApprovalWorkflow({ review, onStatusChange }: { review: any; onStatusChange: (status: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => onStatusChange('approved')} variant="default">✅ Approve & Go Live</Button>
      <Button onClick={() => onStatusChange('rejected')} variant="destructive">❌ Reject</Button>
      <Button onClick={() => onStatusChange('in_review')} variant="secondary">🔄 Request More Info</Button>
    </div>
  );
}