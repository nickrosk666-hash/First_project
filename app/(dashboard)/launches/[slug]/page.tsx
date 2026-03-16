"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  FileCode,
  FolderOpen,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FileEntry {
  path: string;
  size: number;
}

interface Launch {
  id: number;
  productName: string;
  tagline: string;
  slug: string;
  projectDir: string;
  generatedAt: string;
  domain?: string;
}

function getFileIcon(filePath: string) {
  if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) return "🔷";
  if (filePath.endsWith(".json")) return "📋";
  if (filePath.endsWith(".sql")) return "🗄️";
  if (filePath.endsWith(".css")) return "🎨";
  if (filePath.endsWith(".md")) return "📝";
  if (filePath.endsWith(".js")) return "🟡";
  return "📄";
}

function getLang(filePath: string) {
  if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) return "typescript";
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".sql")) return "sql";
  if (filePath.endsWith(".css")) return "css";
  if (filePath.endsWith(".md")) return "markdown";
  if (filePath.endsWith(".js")) return "javascript";
  return "text";
}

export default function LaunchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [launch, setLaunch] = useState<Launch | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/launches/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setLaunch(d.launch);
        setFiles(d.files || []);
        setLoading(false);
        if (d.files?.length > 0) loadFile(d.files[0].path);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadFile = useCallback(
    async (filePath: string) => {
      setFileLoading(true);
      setSelectedFile(filePath);
      try {
        const r = await fetch(
          `/api/launches/${slug}/file?path=${encodeURIComponent(filePath)}`
        );
        const d = await r.json();
        setContent(d.content || "");
        setOriginalContent(d.content || "");
        setSaved(false);
      } catch {
        setContent("// Ошибка загрузки файла");
      }
      setFileLoading(false);
    },
    [slug]
  );

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await fetch(
        `/api/launches/${slug}/file?path=${encodeURIComponent(selectedFile)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      setOriginalContent(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const copyContent = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isDirty = content !== originalContent;

  // Group files by directory
  const fileGroups: Record<string, FileEntry[]> = {};
  for (const f of files) {
    const dir = f.path.includes("/") ? f.path.split("/").slice(0, -1).join("/") : "";
    if (!fileGroups[dir]) fileGroups[dir] = [];
    fileGroups[dir].push(f);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" /> Загрузка...
      </div>
    );
  }

  if (!launch) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
        <p>Запуск не найден</p>
        <Button variant="ghost" size="sm" onClick={() => router.push("/launches")}>
          <ArrowLeft className="size-4 mr-1" /> Назад
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => router.push("/launches")}
        >
          <ArrowLeft className="size-3.5" />
          Запуски
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">{launch.productName}</span>
          <span className="text-muted-foreground text-xs ml-2">{launch.tagline}</span>
        </div>
        <Badge variant="outline" className="text-xs text-green-400 border-green-400/30 shrink-0">
          {files.length} файлов
        </Badge>
        <div className="shrink-0 text-xs font-mono text-muted-foreground hidden md:block">
          {launch.projectDir}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* File tree */}
        <div className="w-56 shrink-0 border-r overflow-y-auto bg-muted/20">
          <div className="p-2">
            {Object.entries(fileGroups).map(([dir, dirFiles]) => (
              <div key={dir} className="mb-1">
                {dir && (
                  <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
                    <FolderOpen className="size-3 shrink-0" />
                    <span className="truncate font-medium">{dir}/</span>
                  </div>
                )}
                {dirFiles.map((f) => {
                  const name = f.path.split("/").pop() || f.path;
                  const isSelected = selectedFile === f.path;
                  return (
                    <button
                      key={f.path}
                      onClick={() => loadFile(f.path)}
                      className={cn(
                        "w-full text-left flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-muted transition-colors",
                        dir && "pl-5",
                        isSelected && "bg-muted font-medium"
                      )}
                    >
                      <span>{getFileIcon(f.path)}</span>
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor toolbar */}
          {selectedFile && (
            <div className="flex items-center gap-2 px-3 py-2 border-b text-xs shrink-0">
              <FileCode className="size-3.5 text-muted-foreground" />
              <span className="font-mono text-muted-foreground flex-1">{selectedFile}</span>
              <Badge variant="secondary" className="text-xs">
                {getLang(selectedFile)}
              </Badge>
              {isDirty && (
                <span className="text-amber-400 text-xs">● не сохранено</span>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs gap-1"
                onClick={copyContent}
              >
                {copied ? (
                  <Check className="size-3 text-green-400" />
                ) : (
                  <Copy className="size-3" />
                )}
                {copied ? "Скопировано" : "Копировать"}
              </Button>
              <Button
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={saveFile}
                disabled={!isDirty || saving}
              >
                {saving ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="size-3 text-green-400" />
                ) : (
                  <Save className="size-3" />
                )}
                {saved ? "Сохранено" : "Сохранить"}
              </Button>
            </div>
          )}

          {/* Code area */}
          {fileLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : selectedFile ? (
            <textarea
              className="flex-1 w-full resize-none bg-[#0d0d0d] text-sm font-mono p-4 outline-none text-foreground leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              style={{ tabSize: 2 }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Выбери файл из дерева слева
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
