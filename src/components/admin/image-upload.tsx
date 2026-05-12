"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/admin-actions";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket: "units" | "barbers" | "products";
  pathPrefix: string;
  label?: string;
  aspectRatio?: "square" | "wide";
};

async function toWebP(file: File): Promise<File> {
  if (file.type === "image/webp") return file;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (!blob) { resolve(file); return; }
          const name = file.name.replace(/\.[^.]+$/, ".webp");
          resolve(new File([blob], name, { type: "image/webp" }));
        },
        "image/webp",
        0.88,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); resolve(file); };
    img.src = URL.createObjectURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  pathPrefix,
  label,
  aspectRatio = "square",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Ficheiro inválido — selecione uma imagem.");
      return;
    }
    setUploading(true);
    try {
      const webpFile = await toWebP(file);
      const path = `${pathPrefix}/${Date.now()}.webp`;
      const url = await uploadImage(bucket, path, webpFile);
      onChange(url);
      toast.success("Imagem carregada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar imagem.");
    } finally {
      setUploading(false);
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
    "relative overflow-hidden rounded-xl border-2 transition-colors",
    aspectRatio === "square" ? "aspect-square" : "aspect-video",
    value
      ? "border-border"
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
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
            <p className="text-xs">A converter e carregar…</p>
          </div>
        ) : value ? (
          <>
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              sizes="(max-width: 560px) 100vw, 560px"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors hover:bg-black/20" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
              aria-label="Remover imagem"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white transition-opacity hover:bg-black/80"
            >
              Substituir
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Clique ou arraste a imagem</p>
            <p className="text-xs opacity-60">Converte automaticamente para WebP</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
