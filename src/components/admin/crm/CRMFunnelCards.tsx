import { motion } from "framer-motion";
import { UserCheck, UserPlus, UserX, Crown } from "lucide-react";

interface FunnelData {
  lead: number;
  active: number;
  inactive: number;
  vip: number;
}

interface Props {
  data: FunnelData;
  selected: string | null;
  onSelect: (status: string | null) => void;
}

const funnelItems = [
  { key: "lead", label: "Leads", icon: UserPlus, color: "text-blue-600", bg: "bg-blue-500/15" },
  { key: "active", label: "Ativos", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-500/15" },
  { key: "inactive", label: "Inativos", icon: UserX, color: "text-amber-600", bg: "bg-amber-500/15" },
  { key: "vip", label: "VIP", icon: Crown, color: "text-violet-600", bg: "bg-violet-500/15" },
];

export default function CRMFunnelCards({ data, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {funnelItems.map((item) => {
        const isActive = selected === item.key;
        return (
          <motion.button
            key={item.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(isActive ? null : item.key)}
            className={`bg-supet-bg-alt rounded-3xl p-5 flex items-center gap-3 transition-all text-left ${
              isActive ? "ring-2 ring-primary shadow-lg shadow-primary/10" : "hover:shadow-md"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
              <p className="text-xl font-extrabold text-foreground">{data[item.key as keyof FunnelData]}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
