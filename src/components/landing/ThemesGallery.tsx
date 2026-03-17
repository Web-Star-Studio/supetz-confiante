import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CARDS = [
  {
    id: 1,
    title: "Pelagem Brilhante",
    category: "RESULTADO",
    image: "/images/pet-studio.png",
  },
  {
    id: 2,
    title: "Mais Energia",
    category: "RESULTADO",
    image: "/images/pet-happy-playing.png",
  },
  {
    id: 3,
    title: "Conforto Diário",
    category: "RESULTADO",
    image: "/images/pet-comfortable-home.png",
  },
  {
    id: 4,
    title: "Pelagem Saudável",
    category: "RESULTADO",
    image: "/images/pet-healthy-coat.png",
  },
  {
    id: 5,
    title: "Imunidade Forte",
    category: "RESULTADO",
    image: "/images/lifestyle-dog.png",
  },
  {
    id: 6,
    title: "Pelo Forte",
    category: "RESULTADO",
    image: "/images/dog-closeup.png",
  },
  {
    id: 7,
    title: "Bem-Estar",
    category: "RESULTADO",
    image: "/images/hero-dog.png",
  },
  {
    id: 8,
    title: "Fórmula Premium",
    category: "PRODUTO",
    image: "/images/product-bottle.png",
  },
];

const Card = ({ item }: { item: (typeof CARDS)[0] }) => (
  <div className="group flex h-full w-[240px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-supet-orange/15 bg-white/90 p-3 shadow-[0_16px_36px_-22px_rgba(34,20,9,0.6)] transition-all duration-500 hover:z-10 hover:scale-[1.02] hover:shadow-[0_24px_50px_-26px_rgba(34,20,9,0.7)] md:w-[300px]">
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-supet-bg-alt">
      <img
        src={item.image}
        alt={item.title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
    </div>
    <div className="mt-4 flex items-end justify-between px-1 pb-1">
      <div className="flex flex-col">
        <span className="text-[10px] font-black tracking-widest text-supet-orange uppercase">
          {item.category}
        </span>
        <h3 className="text-lg font-bold text-supet-text -mt-0.5">
          {item.title}
        </h3>
      </div>
      <div className="group/btn flex h-9 w-9 items-center justify-center rounded-full bg-supet-orange/10 text-supet-orange transition-colors hover:bg-supet-orange hover:text-white">
        <ArrowRight
          size={16}
          strokeWidth={3}
          className="transition-transform group-hover/btn:rotate-[-45deg]"
        />
      </div>
    </div>
  </div>
);

const reversed = [...CARDS].reverse();
const shuffled = [...CARDS.slice(4), ...CARDS.slice(0, 4)];

export default function ThemesGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Track 1 moves left as you scroll down
  const x1 = useTransform(scrollYProgress, [0, 1], ["5%", "-45%"]);
  // Track 2 moves right
  const x2 = useTransform(scrollYProgress, [0, 1], ["-40%", "5%"]);
  // Track 3 moves left, slightly different range
  const x3 = useTransform(scrollYProgress, [0, 1], ["10%", "-35%"]);

  const triple = [...CARDS, ...CARDS];
  const tripleReversed = [...reversed, ...reversed];
  const tripleShuffled = [...shuffled, ...shuffled];

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden bg-supet-bg py-24 md:py-32">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-28 bg-gradient-to-r from-supet-bg to-transparent md:w-48" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-28 bg-gradient-to-l from-supet-bg to-transparent md:w-48" />

      <div className="mx-auto mb-14 max-w-6xl px-6 text-center">
        <span className="text-xs font-black tracking-widest text-supet-orange uppercase">
          Transformações
        </span>
        <h2 className="mt-2 text-3xl font-black text-supet-text md:text-4xl lg:text-5xl leading-tight">
          Pets e donos felizes com Supet
        </h2>
      </div>

      <div className="-rotate-2 flex flex-col gap-5">
        <motion.div className="flex w-max gap-5 px-2.5" style={{ x: x1 }}>
          {triple.map((item, i) => (
            <Card key={`t1-${item.id}-${i}`} item={item} />
          ))}
        </motion.div>

        <motion.div className="flex w-max gap-5 px-2.5" style={{ x: x2 }}>
          {tripleReversed.map((item, i) => (
            <Card key={`t2-${item.id}-${i}`} item={item} />
          ))}
        </motion.div>

        <motion.div className="flex w-max gap-5 px-2.5" style={{ x: x3 }}>
          {tripleShuffled.map((item, i) => (
            <Card key={`t3-${item.id}-${i}`} item={item} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
