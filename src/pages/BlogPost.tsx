import { useParams, Link, Navigate } from "react-router-dom";
import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft, Clock, ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { blogPosts, blogPreviews } from "@/services/mockData";
import { motionTokens } from "@/lib/motion";
import { BlogPostContent as BlogPostContentType } from "@/types";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Parses **bold** markdown into <strong> elements */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-supet-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/* ─── Content Blocks ─────────────────────────────────────────────────── */

function ContentBlock({
  block,
  isFirst,
}: {
  block: BlogPostContentType;
  isFirst: boolean;
}) {
  switch (block.type) {
    /* ── Paragraph ────────────────────────────────────────────── */
    case "paragraph":
      if (isFirst) {
        const first = block.content.charAt(0);
        const rest = block.content.slice(1);
        return (
          <p className="mb-10 font-serif text-[1.18rem] md:text-[1.28rem] leading-[1.95] text-supet-text/80 tracking-[0.005em]">
            <span
              className="float-left mr-3 md:mr-4 mt-1 font-display text-[3.8rem] md:text-[4.5rem] font-extrabold leading-[0.75] text-supet-orange select-none"
              aria-hidden="true"
            >
              {first}
            </span>
            {renderInline(rest)}
          </p>
        );
      }
      return (
        <p className="mb-8 font-serif text-[1.08rem] md:text-[1.15rem] leading-[1.95] text-supet-text/75 tracking-[0.005em]">
          {renderInline(block.content)}
        </p>
      );

    /* ── Heading 2 ────────────────────────────────────────────── */
    case "heading":
      if (block.level === 2) {
        return (
          <h2 className="mt-14 md:mt-20 mb-6 font-display text-[1.5rem] md:text-[1.85rem] font-extrabold tracking-tight leading-[1.2] text-supet-text">
            {block.content}
          </h2>
        );
      }
      /* ── Heading 3 ──────────────────────────────────────────── */
      return (
        <h3 className="mt-10 mb-4 font-display text-[1.15rem] md:text-[1.3rem] font-bold tracking-tight leading-[1.25] text-supet-text/90">
          {block.content}
        </h3>
      );

    /* ── List ──────────────────────────────────────────────────── */
    case "list":
      return (
        <div className="my-10 md:my-12 -mx-2 md:-mx-6 rounded-2xl bg-supet-bg/80 border border-supet-text/[0.04] px-6 py-6 md:px-10 md:py-8">
          <ul className="space-y-5">
            {block.items?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-supet-orange text-[11px] font-extrabold text-white">
                  {idx + 1}
                </span>
                <span className="font-serif text-[1.02rem] md:text-[1.08rem] leading-[1.8] text-supet-text/75">
                  {renderInline(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );

    /* ── Quote ─────────────────────────────────────────────────── */
    case "quote":
      return (
        <figure className="my-14 md:my-20 -mx-2 md:-mx-8 relative">
          {/* Background card */}
          <div className="rounded-2xl bg-supet-orange/[0.04] border border-supet-orange/10 px-8 py-10 md:px-14 md:py-14">
            {/* Large decorative quote mark */}
            <span
              className="block font-serif text-[5rem] md:text-[7rem] leading-none text-supet-orange/20 select-none -mb-10 md:-mb-14"
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <blockquote>
              <p className="font-serif text-[1.15rem] md:text-[1.35rem] font-medium italic leading-[1.7] text-supet-text/85">
                {block.content}
              </p>
            </blockquote>
          </div>
        </figure>
      );

    /* ── Image ─────────────────────────────────────────────────── */
    case "image":
      return (
        <figure className="my-12 md:my-16 -mx-4 md:-mx-16">
          <img
            src={block.content}
            alt={block.alt || ""}
            className="w-full rounded-xl md:rounded-2xl"
          />
          {block.alt && (
            <figcaption className="mt-4 text-center font-body text-[0.8rem] italic text-supet-text/40 tracking-wide">
              {block.alt}
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);
  const articleRef = useRef<HTMLElement>(null);

  // Reading progress
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ["start start", "end end"],
  });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001,
  });

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const relatedArticles = post.relatedPosts
    ? blogPreviews.filter((p) => post.relatedPosts?.includes(p.id)).slice(0, 3)
    : [];

  const authorInitials = post.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const relatedWithCategory = relatedArticles.map((r) => {
    const fp = blogPosts.find((p) => p.id === r.id);
    return { ...r, category: fp?.category || "", readTime: fp?.readTime || 5 };
  });

  return (
    <Layout>
      {/* Reading progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 z-50 h-[3px] origin-left bg-supet-orange"
      />

      <article ref={articleRef}>
        {/* ─── Hero ─────────────────────────────────────────── */}
        <section className="bg-supet-bg pt-28 pb-10 md:pt-36 md:pb-14">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            {/* Breadcrumb */}
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Link
                to="/blog"
                className="group mb-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-supet-text/40 hover:text-supet-orange transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Blog
              </Link>
            </motion.nav>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: motionTokens.easeOut }}
            >
              {/* Category + Date row */}
              <div className="flex items-center gap-3 mb-6">
                <span className="rounded-full bg-supet-orange/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-supet-orange">
                  {post.category}
                </span>
                <span className="text-[11px] font-medium text-supet-text/35">
                  {formatDate(post.publishedAt)}
                </span>
              </div>

              <h1 className="font-display text-[clamp(2rem,5.5vw,3.8rem)] font-extrabold leading-[1.06] tracking-tight text-supet-text text-balance">
                {post.title}
              </h1>

              <p className="mt-5 max-w-xl font-serif text-[1.05rem] md:text-[1.15rem] italic text-supet-text/45 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Author + Meta */}
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-supet-text/8 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-supet-orange/10 font-display text-xs font-bold text-supet-orange">
                    {authorInitials}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-supet-text/80">
                      {post.author.name}
                    </p>
                    <p className="text-[11px] text-supet-text/40">
                      {post.author.role}
                    </p>
                  </div>
                </div>

                <span className="hidden h-4 w-px bg-supet-text/10 md:block" />

                <span className="flex items-center gap-1.5 text-[11px] text-supet-text/40 font-medium">
                  <Clock className="h-3 w-3" />
                  {post.readTime} min de leitura
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── Cover image ──────────────────────────────────── */}
        <section className="bg-supet-bg pb-4">
          <div className="mx-auto max-w-4xl px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="overflow-hidden rounded-2xl md:rounded-3xl"
            >
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full aspect-[16/9] object-cover"
              />
            </motion.div>
          </div>
        </section>

        {/* ─── Article body ────────────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto max-w-[680px] px-6 py-14 md:px-8 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {post.content.map((block, index) => (
                <ContentBlock
                  key={index}
                  block={block}
                  isFirst={index === 0}
                />
              ))}
            </motion.div>

            {/* ── Ornamental divider ── */}
            <div className="mt-16 mb-12 flex items-center gap-3">
              <span className="h-px flex-1 bg-supet-text/8" />
              <span className="h-1.5 w-1.5 rounded-full bg-supet-orange/50" />
              <span className="h-px flex-1 bg-supet-text/8" />
            </div>

            {/* ── Tags ── */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-12">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-supet-bg px-4 py-1.5 font-body text-[11px] font-semibold text-supet-text/45 capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Author card ── */}
            <div className="rounded-2xl border border-supet-text/6 bg-supet-bg/60 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-supet-orange/10 font-display text-lg font-extrabold text-supet-orange">
                  {authorInitials}
                </div>
                <div className="flex-1">
                  <p className="font-body text-[10px] font-black uppercase tracking-[0.18em] text-supet-text/30 mb-1">
                    Escrito por
                  </p>
                  <p className="font-display text-lg font-extrabold text-supet-text">
                    {post.author.name}
                  </p>
                  <p className="font-body text-[13px] font-medium text-supet-text/45 mt-0.5">
                    {post.author.role}
                  </p>
                  <p className="mt-3 font-body text-[13px] leading-relaxed text-supet-text/50">
                    Especialista dedicada à saúde e bem-estar animal, com anos
                    de experiência clínica e pesquisa em nutrição funcional
                    veterinária.
                  </p>
                </div>
              </div>
            </div>

            {/* ── CTA ── */}
            <Link
              to="/shop"
              className="group mt-8 flex items-center justify-between rounded-2xl bg-supet-orange p-6 md:p-8 text-white transition-all hover:shadow-xl hover:shadow-supet-orange/20"
            >
              <div>
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mb-1">
                  Cuide do seu pet
                </p>
                <p className="font-display text-lg md:text-xl font-extrabold">
                  Conheça a fórmula Supet
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/60 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* ─── Related articles ────────────────────────────── */}
        {relatedWithCategory.length > 0 && (
          <section className="border-t border-supet-text/6 bg-supet-bg py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <span className="font-body text-[10px] font-black uppercase tracking-[0.25em] text-supet-orange/60 mb-2 block">
                    Continue lendo
                  </span>
                  <h2 className="text-2xl md:text-3xl font-display font-extrabold text-supet-text tracking-tight">
                    Artigos Relacionados
                  </h2>
                </div>
                <Link
                  to="/blog"
                  className="hidden md:inline-flex items-center gap-1 font-body text-[13px] font-bold text-supet-orange hover:text-supet-orange-dark transition-colors"
                >
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedWithCategory.map((related, index) => (
                  <motion.article
                    key={related.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                  >
                    <Link
                      to={`/blog/${related.slug}`}
                      className="group block overflow-hidden rounded-2xl border border-supet-text/6 bg-white transition-all hover:shadow-lg hover:shadow-supet-text/8 hover:border-supet-orange/15"
                    >
                      <div className="overflow-hidden">
                        <img
                          src={related.coverImage}
                          alt={related.title}
                          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          {related.category && (
                            <span className="font-body text-[10px] font-black uppercase tracking-[0.12em] text-supet-orange">
                              {related.category}
                            </span>
                          )}
                          <span className="h-0.5 w-0.5 rounded-full bg-supet-text/20" />
                          <span className="flex items-center gap-1 font-body text-[10px] text-supet-text/35">
                            <Clock className="h-2.5 w-2.5" />
                            {related.readTime} min
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold leading-snug text-supet-text group-hover:text-supet-orange transition-colors line-clamp-2">
                          {related.title}
                        </h3>
                        <p className="mt-2 font-body text-[13px] leading-relaxed text-supet-text/45 line-clamp-2">
                          {related.excerpt}
                        </p>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>

              <Link
                to="/blog"
                className="mt-8 flex items-center justify-center gap-1.5 font-body text-[13px] font-bold text-supet-orange hover:text-supet-orange-dark transition-colors md:hidden"
              >
                Ver todos os artigos <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
}
