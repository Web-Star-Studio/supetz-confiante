import { useState, useRef, useCallback } from "react";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Link, Image, Type, Heading1, Heading2, List, ListOrdered,
  Palette, Undo2, Redo2, Code, Minus, Eye, Pencil,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CampaignTemplateEditorProps {
  value: string;
  onChange: (html: string) => void;
  accentColor?: string;
}

const COLORS = [
  "#000000", "#333333", "#666666", "#999999",
  "#f97316", "#ef4444", "#10b981", "#3b82f6",
  "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6",
];

const FONT_SIZES = [
  { label: "Pequeno", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Grande", value: "4" },
  { label: "Muito grande", value: "5" },
];

export default function CampaignTemplateEditor({ value, onChange, accentColor = "#f97316" }: CampaignTemplateEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = () => {
    if (linkUrl) {
      exec("createLink", linkUrl);
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const insertImage = () => {
    const url = prompt("URL da imagem:");
    if (url) exec("insertImage", url);
  };

  const insertButton = () => {
    const text = prompt("Texto do botão:", "Clique aqui");
    const url = prompt("URL do botão:", "https://");
    if (text && url) {
      const buttonHtml = `<div style="text-align:center;margin:24px 0"><a href="${url}" style="background:${accentColor};color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">${text}</a></div>`;
      exec("insertHTML", buttonHtml);
    }
  };

  const insertDivider = () => {
    exec("insertHTML", '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />');
  };

  const insertVariable = (variable: string) => {
    exec("insertHTML", `<span style="background:#fef3c7;padding:2px 6px;border-radius:4px;font-weight:600;color:#92400e">{{${variable}}}</span>`);
  };

  const ToolBtn = ({ icon: Icon, onClick, title, active }: { icon: any; onClick: () => void; title: string; active?: boolean }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const wrapEmailTemplate = (bodyHtml: string) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      ${bodyHtml}
    </div>
  `;

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border/50 bg-muted/50">
        {/* Format group */}
        <ToolBtn icon={Bold} onClick={() => exec("bold")} title="Negrito" />
        <ToolBtn icon={Italic} onClick={() => exec("italic")} title="Itálico" />
        <ToolBtn icon={Underline} onClick={() => exec("underline")} title="Sublinhado" />
        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Headings */}
        <ToolBtn icon={Heading1} onClick={() => exec("formatBlock", "h1")} title="Título 1" />
        <ToolBtn icon={Heading2} onClick={() => exec("formatBlock", "h2")} title="Título 2" />
        <ToolBtn icon={Type} onClick={() => exec("formatBlock", "p")} title="Parágrafo" />
        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Alignment */}
        <ToolBtn icon={AlignLeft} onClick={() => exec("justifyLeft")} title="Alinhar à esquerda" />
        <ToolBtn icon={AlignCenter} onClick={() => exec("justifyCenter")} title="Centralizar" />
        <ToolBtn icon={AlignRight} onClick={() => exec("justifyRight")} title="Alinhar à direita" />
        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Lists */}
        <ToolBtn icon={List} onClick={() => exec("insertUnorderedList")} title="Lista" />
        <ToolBtn icon={ListOrdered} onClick={() => exec("insertOrderedList")} title="Lista numerada" />
        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Cor do texto"
            >
              <Palette className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec("foreColor", c)}
                  className="w-7 h-7 rounded-lg border border-border/50 hover:scale-110 transition-transform"
                  style={{ background: c }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Font Size */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-bold"
              title="Tamanho da fonte"
            >
              Aa
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-col gap-1">
              {FONT_SIZES.map((s) => (
                <button
                  key={s.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec("fontSize", s.value)}
                  className="px-3 py-1.5 rounded-lg text-sm text-left hover:bg-muted transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Link */}
        <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Inserir link"
            >
              <Link className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="flex gap-2">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-xl bg-muted text-sm text-foreground"
                onKeyDown={(e) => e.key === "Enter" && insertLink()}
              />
              <button onClick={insertLink} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                OK
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <ToolBtn icon={Image} onClick={insertImage} title="Inserir imagem" />
        <ToolBtn icon={Minus} onClick={insertDivider} title="Divisor" />
        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Insert button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertButton}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Inserir botão CTA"
        >
          🔘 Botão
        </button>

        {/* Variables */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Inserir variável dinâmica"
            >
              <Code className="w-4 h-4 inline mr-1" />
              Variáveis
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-col gap-1">
              {[
                { var: "nome", label: "Nome do cliente" },
                { var: "email", label: "E-mail" },
                { var: "cupom", label: "Código do cupom" },
                { var: "desconto", label: "Valor do desconto" },
                { var: "link", label: "Link da ação" },
                { var: "pet_nome", label: "Nome do pet" },
              ].map((v) => (
                <button
                  key={v.var}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertVariable(v.var)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-left hover:bg-muted transition-colors"
                >
                  <span className="text-xs font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{`{{${v.var}}}`}</span>
                  <span className="text-muted-foreground">{v.label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            showPreview ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {showPreview ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "Editar" : "Preview"}
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="p-6 bg-gray-100 min-h-[400px]">
          <div
            className="bg-white rounded-2xl shadow-lg max-w-[600px] mx-auto overflow-hidden"
            dangerouslySetInnerHTML={{ __html: wrapEmailTemplate(value) }}
          />
        </div>
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          dangerouslySetInnerHTML={{ __html: value }}
          className="min-h-[400px] p-6 text-foreground text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3"
          style={{ fontFamily: "Arial, sans-serif" }}
        />
      )}
    </div>
  );
}
