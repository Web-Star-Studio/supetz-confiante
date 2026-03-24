import { useState } from "react";
import {
  Sparkles, Wand2, Tag, FileText, Type, ChevronDown, Loader2, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContentBlock {
  type: "paragraph" | "heading" | "list" | "quote" | "image";
  content?: string;
  items?: string[];
  alt?: string;
  level?: 2 | 3;
}

interface BlogAIToolbarProps {
  editPost: {
    title?: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
  };
  contentBlocks: ContentBlock[];
  onArticleGenerated: (data: {
    title: string;
    excerpt: string;
    category: string;
    tags: string[];
    read_time: number;
    content: ContentBlock[];
  }) => void;
  onExcerptGenerated: (excerpt: string) => void;
  onTagsSuggested: (tags: string[]) => void;
  onTitlesSuggested: (titles: string[]) => void;
  onBlockImproved: (blockIndex: number, newText: string) => void;
  onConclusionGenerated: (text: string) => void;
  selectedBlockIndex: number | null;
  selectedBlockText: string;
}

async function callBlogAI(action: string, payload: any) {
  const { data, error } = await supabase.functions.invoke("blog-ai", {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.result as string;
}

function tryParseJSON(text: string) {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

export default function BlogAIToolbar({
  editPost, contentBlocks, onArticleGenerated, onExcerptGenerated,
  onTagsSuggested, onTitlesSuggested, onBlockImproved, onConclusionGenerated,
  selectedBlockIndex, selectedBlockText,
}: BlogAIToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [topicDialog, setTopicDialog] = useState(false);
  const [topic, setTopic] = useState("");
  const [titlesDialog, setTitlesDialog] = useState(false);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);

  const runAction = async (action: string, payload: any, onSuccess: (result: string) => void) => {
    setLoading(action);
    try {
      const result = await callBlogAI(action, payload);
      onSuccess(result);
    } catch (e: any) {
      toast.error(e.message || "Erro na IA");
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateArticle = () => {
    if (!topic.trim()) return;
    setTopicDialog(false);
    runAction("generate_article", { topic }, (result) => {
      try {
        const data = tryParseJSON(result);
        onArticleGenerated(data);
        toast.success("Artigo gerado com sucesso!");
      } catch {
        toast.error("Erro ao interpretar resposta da IA");
      }
    });
  };

  const handleGenerateExcerpt = () => {
    const contentText = contentBlocks
      .map(b => b.content || b.items?.join(", ") || "")
      .join(" ")
      .slice(0, 500);
    runAction("generate_excerpt", { title: editPost.title, content: contentText }, (result) => {
      onExcerptGenerated(result.replace(/^["']|["']$/g, ""));
      toast.success("Excerpt gerado!");
    });
  };

  const handleSuggestTags = () => {
    runAction("suggest_tags", {
      title: editPost.title, category: editPost.category, excerpt: editPost.excerpt,
    }, (result) => {
      try {
        const tags = tryParseJSON(result);
        onTagsSuggested(tags);
        toast.success("Tags sugeridas!");
      } catch {
        toast.error("Erro ao interpretar tags");
      }
    });
  };

  const handleSuggestTitles = () => {
    const contentText = contentBlocks
      .map(b => b.content || "").join(" ").slice(0, 300);
    runAction("generate_seo_title", { topic: editPost.title || "saúde pet", excerpt: contentText }, (result) => {
      try {
        const titles = tryParseJSON(result);
        setSuggestedTitles(titles);
        setTitlesDialog(true);
      } catch {
        toast.error("Erro ao interpretar títulos");
      }
    });
  };

  const handleImproveBlock = () => {
    if (selectedBlockIndex === null || !selectedBlockText) return;
    const idx = selectedBlockIndex;
    runAction("improve_text", { text: selectedBlockText }, (result) => {
      onBlockImproved(idx, result.replace(/^["']|["']$/g, ""));
      toast.success("Texto melhorado!");
    });
  };

  const handleExpandBlock = () => {
    if (selectedBlockIndex === null || !selectedBlockText) return;
    const idx = selectedBlockIndex;
    runAction("expand_block", { text: selectedBlockText }, (result) => {
      onBlockImproved(idx, result.replace(/^["']|["']$/g, ""));
      toast.success("Texto expandido!");
    });
  };

  const handleGenerateConclusion = () => {
    const contentText = contentBlocks.map(b => b.content || b.items?.join(", ") || "").join(" ").slice(0, 800);
    runAction("generate_conclusion", { title: editPost.title, content: contentText }, (result) => {
      onConclusionGenerated(result.replace(/^["']|["']$/g, ""));
      toast.success("Conclusão gerada!");
    });
  };

  const isLoading = loading !== null;

  return (
    <>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Assistente IA</h3>
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="outline" size="sm"
            onClick={() => setTopicDialog(true)}
            disabled={isLoading}
            className="text-[11px] gap-1.5 border-primary/20 hover:bg-primary/10"
          >
            <Wand2 className="w-3 h-3" /> Gerar artigo
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={handleGenerateExcerpt}
            disabled={isLoading || !editPost.title}
            className="text-[11px] gap-1.5 border-primary/20 hover:bg-primary/10"
          >
            <FileText className="w-3 h-3" /> Gerar excerpt
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={handleSuggestTags}
            disabled={isLoading || !editPost.title}
            className="text-[11px] gap-1.5 border-primary/20 hover:bg-primary/10"
          >
            <Tag className="w-3 h-3" /> Sugerir tags
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={handleSuggestTitles}
            disabled={isLoading}
            className="text-[11px] gap-1.5 border-primary/20 hover:bg-primary/10"
          >
            <Type className="w-3 h-3" /> Títulos SEO
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={handleGenerateConclusion}
            disabled={isLoading || contentBlocks.length === 0}
            className="text-[11px] gap-1.5 border-primary/20 hover:bg-primary/10"
          >
            <BookOpen className="w-3 h-3" /> Conclusão
          </Button>
        </div>

        {selectedBlockIndex !== null && selectedBlockText && (
          <div className="flex gap-1.5 pt-2 border-t border-primary/10">
            <span className="text-[10px] text-muted-foreground self-center mr-1">Bloco selecionado:</span>
            <Button
              variant="outline" size="sm"
              onClick={handleImproveBlock}
              disabled={isLoading}
              className="text-[10px] gap-1 border-primary/20 hover:bg-primary/10 h-7"
            >
              <Wand2 className="w-3 h-3" /> Melhorar
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={handleExpandBlock}
              disabled={isLoading}
              className="text-[10px] gap-1 border-primary/20 hover:bg-primary/10 h-7"
            >
              <ChevronDown className="w-3 h-3" /> Expandir
            </Button>
          </div>
        )}
      </div>

      {/* Topic Dialog */}
      <Dialog open={topicDialog} onOpenChange={setTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Gerar artigo com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Descreva o tema do artigo e a IA gerará um rascunho completo com título, conteúdo, tags e categoria.
            </p>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Como tratar dermatite atópica em golden retrievers..."
              onKeyDown={(e) => e.key === "Enter" && handleGenerateArticle()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialog(false)}>Cancelar</Button>
            <Button onClick={handleGenerateArticle} disabled={!topic.trim()}>
              <Wand2 className="w-4 h-4 mr-1.5" /> Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Titles Dialog */}
      <Dialog open={titlesDialog} onOpenChange={setTitlesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sugestões de Título SEO</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {suggestedTitles.map((t, i) => (
              <button
                key={i}
                onClick={() => { onTitlesSuggested([t]); setTitlesDialog(false); }}
                className="w-full text-left rounded-lg border border-border p-3 text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                {t}
                <span className="block text-[10px] text-muted-foreground mt-0.5">{t.length} caracteres</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
