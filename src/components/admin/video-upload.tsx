"use client";

import { useRef, useState } from "react";
import { Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { getUploadSignedUrl } from "@/lib/admin-actions";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  pathPrefix: string;
  label?: string;
};

const ACCEPT = "video/mp4,video/webm,video/quicktime";

export function VideoUpload({ value, onChange, pathPrefix, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Ficheiro inválido — selecione um vídeo.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${pathPrefix}/${Date.now()}.${ext}`;

      // Get a signed upload URL from the server (auth check happens there)
      const { signedUrl, publicUrl } = await getUploadSignedUrl("units", path);

      // Upload directly from the browser to Supabase — bypasses Next.js body limits
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload falhou: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Erro de rede."));
        xhr.send(file);
      });

      onChange(publicUrl);
      toast.success("Vídeo carregado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar vídeo.");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const containerClass = cn(
    "relative overflow-hidden rounded-xl border-2 transition-colors aspect-video",
    value
      ? "border-border bg-black"
      : dragOver
        ? "border-brand bg-brand/5"
        : "cursor-pointer border-dashed border-border bg-muted/40 hover:border-brand/50 hover:bg-brand/5",
  );

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-sm font-medium leading-none text-foreground">{label}</p>
      )}
      <div
        className={containerClass}
        onClick={() => !value && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
            {progress !== null && progress > 0 ? (
              <>
                <div className="w-full max-w-[180px] overflow-hidden rounded-full bg-border h-1.5">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs">{progress}%</p>
              </>
            ) : (
              <p className="text-xs">A preparar upload…</p>
            )}
          </div>
        ) : value ? (
          <>
            <video
              src={value}
              muted
              loop
              playsInline
              controls
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
              aria-label="Remover vídeo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="absolute bottom-2 right-2 z-10 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white transition-opacity hover:bg-black/80"
            >
              Substituir
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <Video className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Clique ou arraste o vídeo</p>
            <p className="text-xs opacity-60">MP4 / WebM · usado como fundo do hero</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
