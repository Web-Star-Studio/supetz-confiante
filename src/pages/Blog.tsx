import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { blogPreviews } from "@/services/mockData";
import { motionTokens } from "@/lib/motion";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Blog() {
  return (
    <Layout>
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="pointer-events-none absolute -top-14 left-0 h-72 w-72 rounded-full bg-supetz-orange/15 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
            className="mb-10 max-w-3xl"
          >
            <span className="text-xs font-black uppercase tracking-[0.26em] text-supetz-orange">Blog Supet</span>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-supetz-text md:text-6xl">
              Conteúdo prático para cuidar melhor do seu pet.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-supetz-text/65 md:text-base">
              Publicações sobre pele, pelagem, imunidade e rotina saudável para quem busca mais qualidade de vida para
              cães de todas as idades.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPreviews.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="supet-soft-panel overflow-hidden p-3"
              >
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-56 w-full rounded-2xl object-cover"
                  loading="lazy"
                />
                <div className="px-2 pb-3 pt-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-supetz-orange/80">
                    {formatDate(post.publishedAt)}
                  </p>
                  <h2 className="mt-2 text-xl font-bold leading-tight text-supetz-text">{post.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-supetz-text/65">{post.excerpt}</p>
                  <a
                    href={`/blog?post=${post.slug}`}
                    className="mt-4 inline-flex text-sm font-bold uppercase tracking-wide text-supetz-orange transition-colors hover:text-supetz-orange-dark"
                  >
                    Ler artigo
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-supetz-orange text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Sua dose semanal de saúde pet</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Inscreva-se na nossa newsletter e receba dicas práticas para melhorar a qualidade de vida do seu melhor amigo.
            </p>
            <form className="flex flex-col sm:flex-row max-w-lg mx-auto gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 rounded-full px-6 py-4 text-supetz-text bg-white outline-none focus:ring-4 focus:ring-white/30"
                required
              />
              <button
                type="submit"
                className="rounded-full bg-supetz-text text-white px-8 py-4 font-bold hover:bg-supetz-text/90 transition-colors shrink-0"
              >
                Inscrever-se
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
