import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead, { buildBreadcrumbSchema } from "@/components/SEOHead";
import { blogPreviews, blogPosts } from "@/services/mockData";
import { motionTokens } from "@/lib/motion";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const categories = ["Todos", "Saúde da Pele", "Imunidade", "Nutrição", "Alergias", "Bem-estar", "Guia Prático"];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("Todos");

  // Sort previews by date (newest first)
  const sortedPreviews = [...blogPreviews].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Merge preview data with full post data to get categories
  const postsWithCategory = sortedPreviews.map((preview) => {
    const fullPost = blogPosts.find((p) => p.id === preview.id);
    return {
      ...preview,
      category: fullPost?.category || "",
      readTime: fullPost?.readTime || 5,
    };
  });

  const filteredPosts =
    activeCategory === "Todos"
      ? postsWithCategory
      : postsWithCategory.filter((p) => p.category === activeCategory);

  // Featured article = the most recent post
  const featured = filteredPosts[0];
  const restPosts = filteredPosts.slice(1);

  return (
    <Layout>
      <SEOHead
        title="Blog — Dicas de Saúde para Seu Pet"
        description="Artigos, dicas e guias sobre saúde da pele, imunidade, nutrição e bem-estar canino. Conteúdo escrito por especialistas em saúde animal."
        path="/blog"
        jsonLd={buildBreadcrumbSchema([
          { name: "Home", url: "https://supetz-playful-trust.lovable.app/" },
          { name: "Blog", url: "https://supetz-playful-trust.lovable.app/blog" },
        ])}
      />
      {/* Hero + Featured */}
      <section className="bg-supet-bg pt-28 pb-0 md:pt-36">
        <div className="mx-auto max-w-6xl px-6">
          {/* Title row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeOut }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-12"
          >
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-supet-orange/60 mb-4 block">
                Blog Supet
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-[0.95] text-supet-text tracking-tight">
                Conteúdo prático para{" "}
                <span className="text-supet-orange italic font-serif lowercase">
                  cuidar melhor.
                </span>
              </h1>
            </div>
            <p className="max-w-sm text-[15px] text-supet-text/45 font-medium leading-relaxed md:text-right md:pb-1">
              Publicações sobre pele, pelagem, imunidade e rotina saudável para cães de todas as idades.
            </p>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-10 flex gap-2 overflow-x-auto pb-2 scrollbar-none"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-supet-orange text-white shadow-lg shadow-supet-orange/25"
                    : "bg-white border border-supet-text/10 text-supet-text/55 hover:border-supet-orange/30 hover:text-supet-orange"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Featured Article — integrated into hero */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 md:mt-14"
            >
              <Link
                to={`/blog/${featured.slug}`}
                className="group block"
              >
                {/* Image */}
                <div className="overflow-hidden rounded-2xl md:rounded-3xl">
                  <img
                    src={featured.coverImage}
                    alt={featured.title}
                    className="w-full aspect-[2/1] md:aspect-[5/2] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                {/* Text below image */}
                <div className="mt-6 md:mt-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-12 pb-12 md:pb-16">
                  <div className="flex-1 max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="rounded-full bg-supet-orange/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-supet-orange">
                        {featured.category || "Destaque"}
                      </span>
                      <span className="text-[11px] text-supet-text/35 font-medium">
                        {formatDate(featured.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-supet-text/35">
                        <Clock className="h-3 w-3" />
                        {featured.readTime} min
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-extrabold leading-[1.1] text-supet-text tracking-tight group-hover:text-supet-orange transition-colors">
                      {featured.title}
                    </h2>
                  </div>
                  <div className="md:max-w-xs md:pt-10">
                    <p className="text-[15px] leading-relaxed text-supet-text/50 line-clamp-3">
                      {featured.excerpt}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-supet-orange group-hover:gap-3 transition-all">
                      Ler artigo <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Articles Grid */}
      {restPosts.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {restPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-supet-text/6 bg-white transition-all hover:shadow-xl hover:shadow-supet-text/8 hover:border-supet-orange/15"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {post.category && (
                        <span className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-supet-orange shadow-sm">
                          {post.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5 md:p-6">
                      <div className="flex items-center gap-3 mb-3 text-xs text-supet-text/40">
                        <span className="font-medium">{formatDate(post.publishedAt)}</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-supet-text/30" />
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime} min
                        </span>
                      </div>
                      <h2 className="text-lg font-display font-bold leading-tight text-supet-text group-hover:text-supet-orange transition-colors">
                        {post.title}
                      </h2>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-supet-text/50 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-supet-orange group-hover:gap-2.5 transition-all">
                        Ler artigo <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {filteredPosts.length === 0 && (
        <section className="bg-white py-24">
          <div className="mx-auto max-w-md px-6 text-center">
            <p className="text-lg font-bold text-supet-text/50">
              Nenhum artigo encontrado nesta categoria.
            </p>
            <button
              onClick={() => setActiveCategory("Todos")}
              className="mt-4 text-sm font-bold text-supet-orange hover:underline"
            >
              Ver todos os artigos
            </button>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="bg-supet-orange py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-extrabold mb-4">
              Sua dose semanal de saúde pet
            </h2>
            <p className="text-white/75 mb-8 max-w-2xl mx-auto font-medium">
              Inscreva-se na nossa newsletter e receba dicas práticas para melhorar a qualidade de vida do seu melhor amigo.
            </p>
            <form
              className="flex flex-col sm:flex-row max-w-lg mx-auto gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 rounded-full px-6 py-4 text-supet-text bg-white outline-none focus:ring-4 focus:ring-white/30"
                required
              />
              <button
                type="submit"
                className="rounded-full bg-supet-text text-white px-8 py-4 font-bold hover:bg-supet-text/90 transition-colors shrink-0"
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
