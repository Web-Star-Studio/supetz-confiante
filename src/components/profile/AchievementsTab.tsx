import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, PawPrint, Package, BookOpen, MapPin, Star, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Achievement {
  id: string;
  icon: typeof Trophy;
  title: string;
  description: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

export default function AchievementsTab() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (user) loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    setLoading(true);

    const [pets, orders, logs, addresses, points] = await Promise.all([
      supabase.from("pets").select("id").eq("user_id", user!.id),
      supabase.from("orders").select("id").eq("user_id", user!.id),
      supabase.from("treatment_logs").select("id").eq("user_id", user!.id),
      supabase.from("user_addresses").select("id").eq("user_id", user!.id),
      supabase.from("loyalty_points").select("points").eq("user_id", user!.id),
    ]);

    const petCount = pets.data?.length || 0;
    const orderCount = orders.data?.length || 0;
    const logCount = logs.data?.length || 0;
    const addressCount = addresses.data?.length || 0;
    const totalPts = points.data?.reduce((sum, p) => sum + p.points, 0) || 0;
    setTotalPoints(totalPts);

    setAchievements([
      {
        id: "first_pet", icon: PawPrint, title: "Primeiro Amigo",
        description: "Cadastrou seu primeiro pet", color: "text-primary",
        unlocked: petCount >= 1, progress: Math.min(petCount, 1), total: 1,
      },
      {
        id: "first_order", icon: Package, title: "Primeira Compra",
        description: "Realizou sua primeira compra", color: "text-emerald-500",
        unlocked: orderCount >= 1, progress: Math.min(orderCount, 1), total: 1,
      },
      {
        id: "loyal_customer", icon: Package, title: "Cliente Fiel",
        description: "Realizou 5 compras", color: "text-amber-500",
        unlocked: orderCount >= 5, progress: Math.min(orderCount, 5), total: 5,
      },
      {
        id: "treatment_starter", icon: BookOpen, title: "Diário Iniciado",
        description: "Criou 3 registros no diário", color: "text-sky-500",
        unlocked: logCount >= 3, progress: Math.min(logCount, 3), total: 3,
      },
      {
        id: "treatment_master", icon: BookOpen, title: "Mestre do Cuidado",
        description: "Criou 30 registros no diário", color: "text-violet-500",
        unlocked: logCount >= 30, progress: Math.min(logCount, 30), total: 30,
      },
      {
        id: "address_added", icon: MapPin, title: "Endereço Salvo",
        description: "Cadastrou um endereço de entrega", color: "text-rose-500",
        unlocked: addressCount >= 1, progress: Math.min(addressCount, 1), total: 1,
      },
      {
        id: "points_100", icon: Star, title: "Colecionador",
        description: "Acumulou 100 pontos de fidelidade", color: "text-amber-400",
        unlocked: totalPts >= 100, progress: Math.min(totalPts, 100), total: 100,
      },
      {
        id: "points_500", icon: Trophy, title: "Supet VIP",
        description: "Acumulou 500 pontos de fidelidade", color: "text-yellow-500",
        unlocked: totalPts >= 500, progress: Math.min(totalPts, 500), total: 500,
      },
    ]);

    setLoading(false);
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (loading) {
    return (
      <div className="rounded-3xl bg-supet-bg-alt p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Summary card */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center">
        <Trophy className="h-10 w-10 mx-auto text-primary mb-2" />
        <h3 className="text-2xl font-bold text-foreground">{unlockedCount}/{achievements.length}</h3>
        <p className="text-sm text-muted-foreground">Conquistas desbloqueadas</p>
        <div className="mt-3 h-2 rounded-full bg-supet-bg-alt overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full bg-primary" />
        </div>
      </div>

      {/* Achievements grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {achievements.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl p-4 flex items-start gap-3 transition-all ${
              a.unlocked ? "bg-supet-bg-alt" : "bg-supet-bg-alt/50 opacity-60"
            }`}>
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
              a.unlocked ? "bg-primary/15" : "bg-muted"
            }`}>
              {a.unlocked
                ? <a.icon className={`h-5 w-5 ${a.color}`} />
                : <Lock className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground">{a.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
              {a.total && a.total > 1 && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-supet-bg overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((a.progress || 0) / a.total) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{a.progress}/{a.total}</p>
                </div>
              )}
            </div>
            {a.unlocked && <span className="text-lg">✨</span>}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
