import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function RemotionPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-3xl bg-supetz-bg-alt border-2 border-dashed border-supetz-orange/30"
    >
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-supetz-orange/15">
          <Play className="h-7 w-7 text-supetz-orange ml-1" />
        </div>
        <h3 className="mt-5 text-lg font-bold text-supetz-text">Vídeo Remotion</h3>
        <p className="mt-2 text-sm text-supetz-text/50 max-w-sm">
          Placeholder para integração futura com Remotion. O vídeo institucional será renderizado aqui.
        </p>
      </div>
    </motion.div>
  );
}
