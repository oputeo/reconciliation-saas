import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SettingSection({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="fin-card border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-xl">
          {footer}
        </div>
      )}
    </Card>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="fin-card border-slate-200">
      <CardContent className="pt-6">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {hint && <p className="text-xs text-slate-400 mt-2">{hint}</p>}
      </CardContent>
    </Card>
  );
}