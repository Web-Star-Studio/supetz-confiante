import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://supetz-playful-trust.lovable.app";

const staticPages = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/shop", changefreq: "weekly", priority: "0.9" },
  { loc: "/blog", changefreq: "daily", priority: "0.8" },
  { loc: "/sobre", changefreq: "monthly", priority: "0.7" },
  { loc: "/ciencia", changefreq: "monthly", priority: "0.7" },
  { loc: "/faq", changefreq: "monthly", priority: "0.6" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, published_at, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    const staticEntries = staticPages
      .map(
        (p) => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
      )
      .join("\n");

    const blogEntries = (posts || [])
      .map(
        (p) => `  <url>
    <loc>${BASE_URL}/blog/${p.slug}</loc>
    <lastmod>${p.updated_at ? p.updated_at.split("T")[0] : p.published_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${blogEntries}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      status: 500,
      headers: { "Content-Type": "application/xml", ...corsHeaders },
    });
  }
});
