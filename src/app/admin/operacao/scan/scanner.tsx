"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Camera, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gotoClientByToken } from "@/lib/loyalty/actions";

type BarcodeDetectorInstance = {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
};
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

function extractToken(value: string): string {
  const m = value.match(/cliente\/([A-Z0-9-]+)/i);
  return (m?.[1] ?? value).trim();
}

export function Scanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const ok = typeof window !== "undefined" && "BarcodeDetector" in window;
    setSupported(ok);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  async function start() {
    if (!videoRef.current) return;
    if (!window.BarcodeDetector) {
      toast.error("Câmara/BarcodeDetector indisponível — usa entrada manual.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setRunning(true);

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const raw = codes[0].rawValue;
            const token = extractToken(raw);
            goTo(token);
            return;
          }
        } catch {
          // ignore frame failures
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao iniciar câmara.",
      );
    }
  }

  function stop() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setRunning(false);
  }

  function goTo(token: string) {
    stop();
    startTransition(async () => {
      try {
        await gotoClientByToken(token);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Token inválido.");
      }
    });
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const t = extractToken(manual);
    if (!t) return toast.error("Cole o token ou URL do cartão.");
    goTo(t);
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/admin/operacao"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
      </Link>

      <h1 className="mb-1 font-heading text-[26px] font-semibold leading-none tracking-tight">
        Escanear QR
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Aponta a câmara para o QR do cartão (físico ou no telemóvel do cliente).
      </p>

      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        <video
          ref={videoRef}
          className="aspect-square w-full bg-black object-cover"
          playsInline
          muted
        />
      </div>

      <div className="mt-4 flex gap-2">
        {!running ? (
          <Button
            onClick={start}
            disabled={pending}
            className="flex-1 bg-brand text-primary-foreground hover:bg-brand-hover"
          >
            <Camera className="mr-2 h-4 w-4" /> Iniciar câmara
          </Button>
        ) : (
          <Button variant="outline" onClick={stop} className="flex-1">
            Parar
          </Button>
        )}
      </div>

      {supported === false && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
          Este navegador não suporta BarcodeDetector. Usa a caixa abaixo para colar o link/token.
        </p>
      )}

      <form
        onSubmit={submitManual}
        className="mt-6 space-y-2 rounded-2xl border border-border bg-bg-surface p-4"
      >
        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <KeyRound className="h-3.5 w-3.5" /> Entrada manual
        </label>
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Cola o link ou o token do cartão"
          className="h-12 text-base"
        />
        <Button
          type="submit"
          disabled={pending || !manual.trim()}
          className="w-full bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          Abrir cartão
        </Button>
      </form>
    </div>
  );
}
