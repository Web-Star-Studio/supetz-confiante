import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentBlock {
  type: "paragraph" | "heading" | "list" | "quote" | "image";
  content?: string;
  items?: string[];
  alt?: string;
  level?: 2 | 3;
}

interface BlogPreviewProps {
  post: {
    title?: string;
    excerpt?: string;
    cover_image?: string | null;
    category?: string;
    author_name?: string;
    author_role?: string;
    read_time?: number;
    tags?: string[];
    published_at?: string | null;
  };
  contentBlocks: ContentBlock[];
  onClose: () => void;
}

export default function BlogPreview({ post, contentBlocks, onClose }: BlogPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text-muted-foreground">Pré-visualização</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4 mr-1.5" /> Fechar
        </Button>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12">
        {post.category && (
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary mb-4">
            {post.category}
          </span>
        )}

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-foreground mb-4">
          {post.title || "Sem título"}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>
        )}

        <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground border-b border-border pb-6">
          <span className="font-semibold text-foreground">{post.author_name}</span>
          <span>·</span>
          <span>{post.author_role}</span>
          <span>·</span>
          <span>{post.read_time || 5} min de leitura</span>
        </div>

        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title || ""}
            className="w-full aspect-video object-cover rounded-2xl mb-10"
          />
        )}

        <div className="prose prose-lg max-w-none">
          {contentBlocks.map((block, idx) => {
            switch (block.type) {
              case "heading":
                return block.level === 3
                  ? <h3 key={idx} className="text-xl font-bold text-foreground mt-8 mb-3">{block.content}</h3>
                  : <h2 key={idx} className="text-2xl font-bold text-foreground mt-10 mb-4">{block.content}</h2>;
              case "paragraph":
                return <p key={idx} className="text-base text-foreground/80 leading-relaxed mb-4">{block.content}</p>;
              case "list":
                return (
                  <ul key={idx} className="list-disc pl-6 space-y-2 mb-4">
                    {block.items?.map((item, i) => (
                      <li key={i} className="text-base text-foreground/80 leading-relaxed">{item}</li>
                    ))}
                  </ul>
                );
              case "quote":
                return (
                  <blockquote key={idx} className="border-l-4 border-primary pl-4 italic text-foreground/70 my-6">
                    {block.content}
                  </blockquote>
                );
              case "image":
                return block.content ? (
                  <figure key={idx} className="my-6">
                    <img src={block.content} alt={block.alt || ""} className="w-full rounded-xl" />
                    {block.alt && <figcaption className="text-sm text-muted-foreground mt-2 text-center">{block.alt}</figcaption>}
                  </figure>
                ) : null;
              default:
                return null;
            }
          })}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
            {post.tags.map(tag => (
              <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
