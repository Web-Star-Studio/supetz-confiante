import { motion } from "framer-motion";
import { CreditCard, Headset, ShieldCheck, Truck } from "lucide-react";
import { motionTokens } from "@/lib/motion";

const securityItems = [
  {
    title: "Site protegido e seguro",
    Icon: ShieldCheck,
  },
  {
    title: "Pagamento seguro",
    Icon: CreditCard,
  },
  {
    title: "Entrega em todo Brasil",
    Icon: Truck,
  },
  {
    title: "Atendimento ao cliente",
    Icon: Headset,
  },
];

export default function PurchaseSecuritySection() {
  return (
    <section id="seguranca" className="relative overflow-hidden bg-supet-bg-alt py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-xs font-black uppercase tracking-[0.26em] text-supet-orange">Seguranca da compra</span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-supet-text md:text-5xl">
            Comprar pela internet e seguro
          </h2>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {securityItems.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: motionTokens.durationFast, delay: index * 0.06, ease: motionTokens.easeOut }}
              className="supet-soft-panel flex items-center gap-4 p-6"
            >
              <div className="rounded-2xl border border-supet-orange/25 bg-supet-orange/10 p-3">
                <item.Icon className="h-6 w-6 text-supet-orange" />
              </div>
              <p className="text-sm font-bold text-supet-text/80 md:text-base">{item.title}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
