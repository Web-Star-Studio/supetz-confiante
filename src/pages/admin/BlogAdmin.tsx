import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, Plus, Search, Edit, Trash2, Eye, EyeOff, Save, X,
  Calendar, Clock, Tag, Image, ArrowLeft, RefreshCw, Loader2,
  GripVertical, ExternalLink, Copy, ArrowUp, ArrowDown, Monitor,
  LetterText,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BlogAIToolbar from "@/components/admin/blog/BlogAIToolbar";
import BlogPreview from "@/components/admin/blog/BlogPreview";

/* ─── Types ─── */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: any[];
  cover_image: string | null;
  category: string;
  tags: string[];
  author_name: string;
  author_role: string;
  read_time: number;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentBlock {
  type: "paragraph" | "heading" | "list" | "quote" | "image";
  content?: string;
  items?: string[];
  alt?: string;
  level?: 2 | 3;
}

const CATEGORIES = [
  "Saúde da Pele", "Imunidade", "Nutrição", "Alergias", "Bem-estar", "Guia Prático",
];

const EMPTY_POST: Partial<BlogPost> = {
  title: "", slug: "", excerpt: "", content: [], cover_image: "",
  category: "", tags: [], author_name: "Dra. Marina Costa",
  author_role: "Veterinária Especialista", read_time: 5, status: "draft", published_at: null,
};

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function countWords(blocks: ContentBlock[]): number {
  return blocks.reduce((acc, b) => {
    const text = b.content || b.items?.join(" ") || "";
    return acc + text.split(/\s+/).filter(Boolean).length;
  }, 0);
}

/* ─── Main Component ─── */
export default function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [editing, setEditing] = useState(false);
  const [editPost, setEditPost] = useState<Partial<BlogPost>>(EMPTY_POST);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBlockImg, setUploadingBlockImg] = useState<number | null>(null);

  const compressImage = (file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Compression failed")),
          "image/webp", quality
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const compressed = await compressImage(file);
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const { error } = await supabase.storage.from("blog-images").upload(fileName, compressed, { contentType: "image/webp" });
      if (error) { toast.error("Erro ao enviar imagem"); return null; }
      const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(fileName);
      toast.success(`Imagem otimizada: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`);
      return urlData.publicUrl;
    } catch {
      toast.error("Erro ao processar imagem");
      return null;
    }
  };

  useEffect(() => { loadPosts(); }, []);

  // Auto-save draft every 30s when dirty
  useEffect(() => {
    if (!editing || !isDirty || editPost.status === "published") return;
    const timer = setTimeout(() => {
      if (editPost.id && isDirty) {
        savePost(true);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [isDirty, editing, contentBlocks, editPost]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar posts");
    else setPosts((data || []) as BlogPost[]);
    setLoading(false);
  };

  const filteredPosts = posts.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openEditor = (post?: BlogPost) => {
    if (post) {
      setEditPost({ ...post });
      setContentBlocks(Array.isArray(post.content) ? post.content : []);
    } else {
      setEditPost({ ...EMPTY_POST });
      setContentBlocks([]);
    }
    setSelectedBlockIdx(null);
    setIsDirty(false);
    setEditing(true);
  };

  const closeEditor = () => {
    setEditing(false);
    setEditPost(EMPTY_POST);
    setContentBlocks([]);
    setSelectedBlockIdx(null);
    setShowPreview(false);
    setIsDirty(false);
  };

  const handleTitleChange = (title: string) => {
    const isNew = !editPost.id;
    setEditPost(p => ({ ...p, title, ...(isNew ? { slug: slugify(title) } : {}) }));
    markDirty();
  };

  const addContentBlock = (type: ContentBlock["type"]) => {
    const block: ContentBlock = { type, content: "" };
    if (type === "heading") block.level = 2;
    if (type === "list") { block.items = [""]; delete block.content; }
    setContentBlocks(prev => [...prev, block]);
    markDirty();
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    setContentBlocks(prev => prev.map((b, i) => i === index ? { ...b, ...updates } : b));
    markDirty();
  };

  const removeBlock = (index: number) => {
    setContentBlocks(prev => prev.filter((_, i) => i !== index));
    if (selectedBlockIdx === index) setSelectedBlockIdx(null);
    markDirty();
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= contentBlocks.length) return;
    setContentBlocks(prev => {
      const arr = [...prev];
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
    setSelectedBlockIdx(target);
    markDirty();
  };

  const duplicateBlock = (index: number) => {
    setContentBlocks(prev => {
      const arr = [...prev];
      arr.splice(index + 1, 0, { ...prev[index], items: prev[index].items ? [...prev[index].items!] : undefined });
      return arr;
    });
    markDirty();
  };

  const addListItem = (blockIndex: number) => {
    setContentBlocks(prev => prev.map((b, i) => {
      if (i === blockIndex && b.items) return { ...b, items: [...b.items, ""] };
      return b;
    }));
    markDirty();
  };

  const updateListItem = (blockIndex: number, itemIndex: number, value: string) => {
    setContentBlocks(prev => prev.map((b, i) => {
      if (i === blockIndex && b.items) {
        const items = [...b.items]; items[itemIndex] = value;
        return { ...b, items };
      }
      return b;
    }));
    markDirty();
  };

  const removeListItem = (blockIndex: number, itemIndex: number) => {
    setContentBlocks(prev => prev.map((b, i) => {
      if (i === blockIndex && b.items) return { ...b, items: b.items.filter((_, j) => j !== itemIndex) };
      return b;
    }));
    markDirty();
  };

  const addTag = () => {
    const t = newTag.trim();
    if (!t || editPost.tags?.includes(t)) return;
    setEditPost(p => ({ ...p, tags: [...(p.tags || []), t] }));
    setNewTag("");
    markDirty();
  };

  const removeTag = (tag: string) => {
    setEditPost(p => ({ ...p, tags: (p.tags || []).filter(t => t !== tag) }));
    markDirty();
  };

  const savePost = async (silent = false) => {
    if (!editPost.title?.trim()) { if (!silent) toast.error("Título é obrigatório"); return; }
    if (!editPost.slug?.trim()) { if (!silent) toast.error("Slug é obrigatório"); return; }
    setSaving(true);
    const postData = {
      title: editPost.title, slug: editPost.slug, excerpt: editPost.excerpt || "",
      content: contentBlocks as any, cover_image: editPost.cover_image || null,
      category: editPost.category || "", tags: editPost.tags || [],
      author_name: editPost.author_name || "Dra. Marina Costa",
      author_role: editPost.author_role || "Veterinária Especialista",
      read_time: editPost.read_time || 5, status: editPost.status || "draft",
      published_at: editPost.status === "published"
        ? editPost.published_at || new Date().toISOString().split("T")[0]
        : editPost.published_at,
    };
    let error;
    if (editPost.id) {
      const res = await supabase.from("blog_posts").update(postData).eq("id", editPost.id);
      error = res.error;
    } else {
      const res = await supabase.from("blog_posts").insert(postData).select().single();
      error = res.error;
      if (!error && res.data) setEditPost(p => ({ ...p, id: (res.data as any).id }));
    }
    if (error) { if (!silent) toast.error(`Erro ao salvar: ${error.message}`); }
    else {
      setIsDirty(false);
      if (!silent) { toast.success(editPost.id ? "Post atualizado!" : "Post criado!"); closeEditor(); loadPosts(); }
    }
    setSaving(false);
  };

  const togglePublish = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const updates: any = { status: newStatus };
    if (newStatus === "published" && !post.published_at) updates.published_at = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("blog_posts").update(updates).eq("id", post.id);
    if (error) toast.error("Erro ao atualizar status");
    else { toast.success(newStatus === "published" ? "Post publicado!" : "Post despublicado!"); loadPosts(); }
  };

  const duplicatePost = async (post: BlogPost) => {
    const { id, created_at, updated_at, ...rest } = post;
    const newPost = { ...rest, title: `${post.title} (cópia)`, slug: `${post.slug}-copia-${Date.now()}`, status: "draft", published_at: null };
    const { error } = await supabase.from("blog_posts").insert(newPost);
    if (error) toast.error("Erro ao duplicar");
    else { toast.success("Post duplicado!"); loadPosts(); }
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", postToDelete.id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Post excluído!"); loadPosts(); }
    setDeleteDialogOpen(false); setPostToDelete(null);
  };

  const publishedCount = posts.filter(p => p.status === "published").length;
  const draftCount = posts.filter(p => p.status === "draft").length;
  const wordCount = countWords(contentBlocks);
  const selectedBlockText = selectedBlockIdx !== null
    ? contentBlocks[selectedBlockIdx]?.content || contentBlocks[selectedBlockIdx]?.items?.join("\n") || ""
    : "";

  // ─── PREVIEW ───
  if (showPreview) {
    return <BlogPreview post={editPost} contentBlocks={contentBlocks} onClose={() => setShowPreview(false)} />;
  }

  // ─── EDITOR VIEW ───
  if (editing) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Editor Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={closeEditor}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
              </Button>
              <h1 className="text-xl font-bold text-foreground">{editPost.id ? "Editar Post" : "Novo Post"}</h1>
              <Badge variant={editPost.status === "published" ? "default" : "outline"} className="text-[10px]">
                {editPost.status === "published" ? "Publicado" : "Rascunho"}
              </Badge>
              {isDirty && <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">Não salvo</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground mr-3">
                <LetterText className="w-3.5 h-3.5" />
                {wordCount} palavras · {contentBlocks.length} blocos · ~{Math.max(1, Math.round(wordCount / 200))} min
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Monitor className="w-4 h-4 mr-1.5" /> Preview
              </Button>
              <div className="flex items-center gap-2 mr-1">
                <span className="text-xs text-muted-foreground">Publicar</span>
                <Switch checked={editPost.status === "published"} onCheckedChange={(v) => { setEditPost(p => ({ ...p, status: v ? "published" : "draft" })); markDirty(); }} />
              </div>
              <Button onClick={() => savePost()} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Title + Slug + Excerpt */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <Input value={editPost.title || ""} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Título do post..." className="text-lg font-bold border-0 px-0 focus-visible:ring-0 shadow-none" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Slug:</span>
                  <Input value={editPost.slug || ""} onChange={(e) => { setEditPost(p => ({ ...p, slug: slugify(e.target.value) })); markDirty(); }} className="h-7 text-xs flex-1" />
                </div>
                <Textarea value={editPost.excerpt || ""} onChange={(e) => { setEditPost(p => ({ ...p, excerpt: e.target.value })); markDirty(); }} placeholder="Resumo do post (excerpt)..." rows={2} className="text-sm" />
              </div>

              {/* AI Toolbar */}
              <BlogAIToolbar
                editPost={editPost}
                contentBlocks={contentBlocks}
                selectedBlockIndex={selectedBlockIdx}
                selectedBlockText={selectedBlockText}
                onArticleGenerated={(data) => {
                  setEditPost(p => ({
                    ...p, title: data.title, excerpt: data.excerpt,
                    category: data.category, tags: data.tags, read_time: data.read_time,
                    slug: p.slug || slugify(data.title),
                  }));
                  setContentBlocks(data.content);
                  markDirty();
                }}
                onExcerptGenerated={(excerpt) => { setEditPost(p => ({ ...p, excerpt })); markDirty(); }}
                onTagsSuggested={(tags) => {
                  setEditPost(p => {
                    const existing = new Set(p.tags || []);
                    tags.forEach(t => existing.add(t));
                    return { ...p, tags: Array.from(existing) };
                  });
                  markDirty();
                }}
                onTitlesSuggested={(titles) => {
                  if (titles.length === 1) {
                    handleTitleChange(titles[0]);
                  }
                }}
                onBlockImproved={(idx, text) => { updateBlock(idx, { content: text }); }}
                onConclusionGenerated={(text) => {
                  setContentBlocks(prev => [
                    ...prev,
                    { type: "heading", content: "Conclusão", level: 2 },
                    { type: "paragraph", content: text },
                  ]);
                  markDirty();
                }}
              />

              {/* Content Blocks */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Conteúdo
                  </h3>
                  <Badge variant="outline" className="text-[10px]">{contentBlocks.length} blocos</Badge>
                </div>

                {contentBlocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Use a IA para gerar ou adicione blocos manualmente</p>
                  </div>
                )}

                <div className="space-y-3">
                  {contentBlocks.map((block, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedBlockIdx(idx)}
                      className={`group relative rounded-xl border p-4 cursor-pointer transition-colors ${selectedBlockIdx === idx ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20 hover:border-border/60"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
                          <Badge variant="outline" className="text-[9px] uppercase">
                            {block.type === "paragraph" ? "Parágrafo" : block.type === "heading" ? `H${block.level || 2}` : block.type === "list" ? "Lista" : block.type === "quote" ? "Citação" : "Imagem"}
                          </Badge>
                          {block.type === "heading" && (
                            <Select value={String(block.level || 2)} onValueChange={(v) => updateBlock(idx, { level: Number(v) as 2 | 3 })}>
                              <SelectTrigger className="h-6 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2">H2</SelectItem>
                                <SelectItem value="3">H3</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); moveBlock(idx, "up"); }} disabled={idx === 0} className="h-6 w-6 p-0"><ArrowUp className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); moveBlock(idx, "down"); }} disabled={idx === contentBlocks.length - 1} className="h-6 w-6 p-0"><ArrowDown className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); duplicateBlock(idx); }} className="h-6 w-6 p-0"><Copy className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeBlock(idx); }} className="h-6 w-6 p-0 text-destructive"><X className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>

                      {block.type === "list" ? (
                        <div className="space-y-2">
                          {(block.items || []).map((item, itemIdx) => (
                            <div key={itemIdx} className="flex gap-2">
                              <span className="text-xs text-muted-foreground mt-2 w-5 shrink-0">{itemIdx + 1}.</span>
                              <Input value={item} onChange={(e) => updateListItem(idx, itemIdx, e.target.value)} className="text-xs flex-1" placeholder={`Item ${itemIdx + 1}...`} />
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeListItem(idx, itemIdx); }} className="h-8 w-8 p-0 text-destructive shrink-0"><X className="w-3 h-3" /></Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addListItem(idx); }} className="text-xs"><Plus className="w-3 h-3 mr-1" /> Item</Button>
                        </div>
                      ) : block.type === "image" ? (
                        <div className="space-y-2">
                          {!block.content && (
                            <label className="flex flex-col items-center justify-center w-full h-28 rounded-lg bg-muted/30 border-2 border-dashed border-border cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                              {uploadingBlockImg === idx ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : (
                                <><Image className="w-5 h-5 text-muted-foreground mb-1" /><span className="text-[10px] text-muted-foreground">Upload de imagem</span></>
                              )}
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0]; if (!file) return;
                                setUploadingBlockImg(idx);
                                const url = await uploadImage(file);
                                if (url) updateBlock(idx, { content: url });
                                setUploadingBlockImg(null);
                              }} />
                            </label>
                          )}
                          <Input value={block.content || ""} onChange={(e) => updateBlock(idx, { content: e.target.value })} placeholder="Ou cole a URL da imagem..." className="text-xs" />
                          <Input value={block.alt || ""} onChange={(e) => updateBlock(idx, { alt: e.target.value })} placeholder="Texto alternativo (alt)..." className="text-xs" />
                          {block.content && (
                            <div className="relative">
                              <img src={block.content} alt={block.alt || ""} className="w-full max-h-40 object-cover rounded-lg" />
                              <Button variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); updateBlock(idx, { content: "" }); }}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Textarea value={block.content || ""} onChange={(e) => updateBlock(idx, { content: e.target.value })} rows={block.type === "paragraph" ? 4 : 2} className="text-xs font-mono" placeholder={block.type === "paragraph" ? "Texto do parágrafo..." : block.type === "heading" ? "Título da seção..." : "Texto da citação..."} />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                  {(["paragraph", "heading", "list", "quote", "image"] as const).map(type => (
                    <Button key={type} variant="outline" size="sm" onClick={() => addContentBlock(type)} className="text-xs gap-1.5">
                      <Plus className="w-3 h-3" /> {type === "paragraph" ? "Parágrafo" : type === "heading" ? "Título" : type === "list" ? "Lista" : type === "quote" ? "Citação" : "Imagem"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Cover Image */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Image className="w-4 h-4 text-primary" /> Capa</h3>
                {editPost.cover_image ? (
                  <div className="relative">
                    <img src={editPost.cover_image} alt="Capa" className="w-full aspect-video object-cover rounded-lg" />
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => { setEditPost(p => ({ ...p, cover_image: "" })); markDirty(); }}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-video rounded-lg bg-muted/30 border-2 border-dashed border-border cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    {uploadingCover ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : (
                      <>
                        <Image className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Clique para enviar</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      setUploadingCover(true);
                      const url = await uploadImage(file);
                      if (url) { setEditPost(p => ({ ...p, cover_image: url })); markDirty(); }
                      setUploadingCover(false);
                    }} />
                  </label>
                )}
                <Input value={editPost.cover_image || ""} onChange={(e) => { setEditPost(p => ({ ...p, cover_image: e.target.value })); markDirty(); }} placeholder="Ou cole a URL da imagem..." className="text-xs" />
              </div>

              {/* Category */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">Categoria</h3>
                <Select value={editPost.category || ""} onValueChange={(v) => { setEditPost(p => ({ ...p, category: v })); markDirty(); }}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Selecionar categoria..." /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> Tags</h3>
                <div className="flex gap-2">
                  <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Nova tag..." className="flex-1 text-xs" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                  <Button size="sm" onClick={addTag} disabled={!newTag.trim()}><Plus className="w-3.5 h-3.5" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(editPost.tags || []).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Author */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">Autor</h3>
                <Input value={editPost.author_name || ""} onChange={(e) => { setEditPost(p => ({ ...p, author_name: e.target.value })); markDirty(); }} placeholder="Nome do autor..." className="text-xs" />
                <Input value={editPost.author_role || ""} onChange={(e) => { setEditPost(p => ({ ...p, author_role: e.target.value })); markDirty(); }} placeholder="Cargo / especialidade..." className="text-xs" />
              </div>

              {/* Meta */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">Metadados</h3>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Tempo de leitura (min)</label>
                  <Input type="number" value={editPost.read_time || 5} onChange={(e) => { setEditPost(p => ({ ...p, read_time: parseInt(e.target.value) || 5 })); markDirty(); }} className="w-20 text-xs" min={1} max={60} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Data de publicação</label>
                  <Input type="date" value={editPost.published_at || ""} onChange={(e) => { setEditPost(p => ({ ...p, published_at: e.target.value })); markDirty(); }} className="text-xs" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ─── LIST VIEW ───
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FileText className="w-5 h-5" /></div>
              Blog
            </h1>
            <p className="text-sm text-muted-foreground mt-1 ml-[52px]">Gerencie artigos, publique conteúdo e controle o blog da Supet</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadPosts} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Recarregar
            </Button>
            <Button size="sm" onClick={() => openEditor()}><Plus className="w-4 h-4 mr-1.5" /> Novo Post</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total de posts", value: posts.length, icon: FileText, color: "bg-primary/10 text-primary" },
            { label: "Publicados", value: publishedCount, icon: Eye, color: "bg-emerald-500/10 text-emerald-600" },
            { label: "Rascunhos", value: draftCount, icon: EyeOff, color: "bg-amber-500/10 text-amber-600" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}><s.icon className="w-4 h-4" /></div>
              <div><p className="text-xl font-bold text-foreground">{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar posts..." className="pl-9 text-sm" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border bg-card">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Nenhum post encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro artigo clicando em "Novo Post"</p>
            <Button size="sm" className="mt-4" onClick={() => openEditor()}><Plus className="w-4 h-4 mr-1.5" /> Criar Post</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div key={post.id} className="group rounded-xl border border-border bg-card p-4 flex items-center gap-4 hover:border-primary/20 transition-colors">
                {post.cover_image ? (
                  <img src={post.cover_image} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0"><Image className="w-5 h-5 text-muted-foreground/30" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground truncate">{post.title}</h3>
                    <Badge variant={post.status === "published" ? "default" : "outline"} className="text-[9px] shrink-0">{post.status === "published" ? "Publicado" : "Rascunho"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{post.excerpt}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {post.category && <Badge variant="secondary" className="text-[9px]">{post.category}</Badge>}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{post.published_at ? new Date(`${post.published_at}T00:00:00`).toLocaleDateString("pt-BR") : "Sem data"}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {post.read_time} min</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => togglePublish(post)} className="h-8 w-8 p-0" title={post.status === "published" ? "Despublicar" : "Publicar"}>
                    {post.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditor(post)} className="h-8 w-8 p-0"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => duplicatePost(post)} className="h-8 w-8 p-0" title="Duplicar"><Copy className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setPostToDelete(post); setDeleteDialogOpen(true); }} className="h-8 w-8 p-0 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  {post.status === "published" && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ExternalLink className="w-4 h-4" /></Button></a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir post?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir "<strong>{postToDelete?.title}</strong>"? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
