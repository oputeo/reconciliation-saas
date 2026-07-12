import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const getRiskLevel = (score: number) => {
  if (score < 30) return { label: 'Low Risk - Go Live Ready', color: 'text-green-600' };
  if (score < 70) return { label: 'Medium Risk - Requires Fixes', color: 'text-yellow-600' };
  return { label: 'High Risk - Do Not Launch', color: 'text-red-600' };
};

export default function RiskScoreCard({ score = 0 }: { score?: number }) {
  const { label, color } = getRiskLevel(score);
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI + Rules Risk Score</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className={`text-7xl font-bold ${color}`}>{score}</div>
        <Progress value={score} className="h-4" />
        <p className="font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}