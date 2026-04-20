import { Card, CardContent } from "@/components/ui/Card";

export function StatsCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-foreground-secondary">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold text-foreground">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-foreground-muted">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
