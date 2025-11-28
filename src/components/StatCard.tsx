import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  colorClass?: string;
}

export function StatCard({ title, value, icon: Icon, subtitle, colorClass = "bg-primary/10" }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`h-12 w-12 rounded-full ${colorClass} flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
