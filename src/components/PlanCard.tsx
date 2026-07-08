import { Check } from "lucide-react";
import type { PlanDefinition } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlanCard({ plan, ctaLabel = "Escolher plano", onSelect }: { plan: PlanDefinition; ctaLabel?: string; onSelect?: () => void }) {
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition", plan.highlighted && "border-primary ring-2 ring-primary/20")}>
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      <div className="mt-4 text-3xl font-bold">{plan.price}</div>
      <ul className="mt-6 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /><span>{f}</span></li>
        ))}
      </ul>
      <div className="mt-6 flex-1" />
      <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} onClick={onSelect}>{ctaLabel}</Button>
    </div>
  );
}