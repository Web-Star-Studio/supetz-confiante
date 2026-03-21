import { CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react";

const steps = [
  { key: "pending", label: "Pendente", icon: Clock },
  { key: "confirmed", label: "Confirmado", icon: Package },
  { key: "shipped", label: "Enviado", icon: Truck },
  { key: "delivered", label: "Entregue", icon: CheckCircle2 },
];

interface Props {
  status: string;
}

export default function OrderTrackingTimeline({ status }: Props) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 mt-3 px-1">
        <XCircle className="h-4 w-4 text-destructive" />
        <span className="text-xs font-semibold text-destructive">Pedido cancelado</span>
      </div>
    );
  }

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="mt-4 px-1">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-border" />
        <div
          className="absolute top-3.5 left-4 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `calc(${Math.max(0, currentIndex) / (steps.length - 1)} * (100% - 32px))` }}
        />

        {steps.map((step, i) => {
          const Icon = step.icon;
          const isComplete = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step.key} className="relative flex flex-col items-center z-10">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                } ${isCurrent ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span
                className={`mt-1.5 text-[10px] font-medium ${
                  isComplete ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
