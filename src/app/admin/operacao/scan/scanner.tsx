"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupClient } from "@/lib/loyalty/actions";
import { useIsNative } from "@/lib/native/platform";
import { cn } from "@/lib/utils";

function extractHandle(value: string): string {
  // Aceita URL completa ou só handle (slug minúsculo OU token maiúsculo)
  const m = value.match(/cliente\/([A-Za-z0-9-]+)/);
  return (m?.[1] ?? value).trim();
}

type Feedback = {
  kind: "success" | "error";
  title: string;
  sub?: string;
};

export function Scanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handledRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const native = useIsNative();

  // Liberta câmara e loop sem mexer no estado (seguro em unmount).
  function teardown() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  // Cleanup ao desmontar
  useEffect(() => {
    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // App nativa (Capacitor): usa o scanner ML Kit nativo.
  async function startNative() {
    setLoading(true);
    try {
      const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== "granted" && camera !== "limited") {
        toast.error("Permissão de câmara recusada.");
        return;
      }
      const { barcodes } = await BarcodeScanner.scan();
      const raw = barcodes[0]?.rawValue;
      if (!raw) {
        toast.error("Nenhum QR detetado.");
        return;
      }
      const handle = extractHandle(raw);
      if (handle) goTo(handle);
    } catch (err) {
      console.error("[scanner:native]", err);
      toast.error(
        err instanceof Error ? `Falha no scanner: ${err.message}` : "Falha no scanner.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Web: jsQR sobre os frames do vídeo (sem worker — fiável em iOS Safari).
  async function start() {
    if (native) return startNative();
    const video = videoRef.current;
    if (!video) return;
    setLoading(true);
    handledRef.current = false;
    try {
      const jsQR = (await import("jsqr")).default;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      setRunning(true);

      const tick = () => {
        if (handledRef.current || !ctx) return;
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth && v.videoHeight) {
          // descodifica numa resolução reduzida para ser rápido
          const scale = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
          const w = Math.round(v.videoWidth * scale);
          const h = Math.round(v.videoHeight * scale);
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(v, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const code = jsQR(img.data, w, h, { inversionAttempts: "attemptBoth" });
          if (code?.data) {
            const handle = extractHandle(code.data);
            if (handle) {
              handledRef.current = true;
              goTo(handle);
              return;
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error("[scanner]", err);
      teardown();
      setRunning(false);
      toast.error(
        err instanceof Error
          ? `Falha ao iniciar câmara: ${err.message}`
          : "Falha ao iniciar câmara.",
      );
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    teardown();
    setRunning(false);
  }

  async function goTo(handle: string) {
    stop();
    setLoading(true);
    try {
      const res = await lookupClient(handle);
      if (res.ok) {
        setFeedback({ kind: "success", title: "Cartão encontrado", sub: res.name });
        setTimeout(() => {
          router.push(`/admin/operacao/cliente/${res.handle}`);
        }, 750);
      } else {
        setFeedback({ kind: "error", title: "Cartão inválido", sub: res.error });
        setTimeout(() => setFeedback(null), 2500);
      }
    } catch (err) {
      setFeedback({
        kind: "error",
        title: "Erro",
        sub: err instanceof Error ? err.message : "Falhou a validação.",
      });
      setTimeout(() => setFeedback(null), 2500);
    } finally {
      setLoading(false);
    }
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const t = extractHandle(manual);
    if (!t) return toast.error("Cola o link ou o handle do cartão.");
    goTo(t);
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/admin/operacao"
        className="mb-4 -ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors duration-150 hover-fine:hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
      </Link>

      <PageHeader
        title="Escanear QR"
        description="Aponta a câmara para o QR do cartão (físico ou no telemóvel do cliente)."
      />

      {!native && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
          <video
            ref={videoRef}
            className="aspect-square w-full bg-black object-cover"
            playsInline
            muted
          />
          {running && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-3/5 w-3/5 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {!running ? (
          <Button
            onClick={start}
            disabled={loading}
            className="flex-1 bg-brand text-primary-foreground hover:bg-brand-hover"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> A iniciar…
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" /> Iniciar câmara
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" onClick={stop} className="flex-1">
            Parar
          </Button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {native
          ? "Toca em iniciar e aponta a câmara ao QR. Permite o acesso quando pedido."
          : "Aponta o QR ao centro do quadrado. A câmara só funciona em HTTPS e tens de permitir o acesso quando o browser pedir."}
      </p>

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
          placeholder="Cola o link ou handle (ex: augusto-dantas-J2VV)"
          className="h-12 text-base"
        />
        <Button
          type="submit"
          disabled={loading || !manual.trim()}
          className="w-full bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          Abrir cartão
        </Button>
      </form>

      {/* Overlay de feedback: verde (sucesso) ou vermelho (erro) */}
      {feedback && (
        <div
          role="status"
          aria-live="assertive"
          onClick={feedback.kind === "error" ? () => setFeedback(null) : undefined}
          className={cn(
            // Entrava a corte seco. `enter-fade` dá-lhe uma entrada curta —
            // o ecrã inteiro a mudar de cor de repente é agressivo.
            "fixed inset-0 z-[100] flex animate-[enter-fade_140ms_var(--ease-out-strong)_both] items-center justify-center p-6",
            feedback.kind === "success"
              ? "bg-emerald-500/95"
              : "cursor-pointer bg-destructive/95",
          )}
        >
          <div className="flex animate-[enter-up_260ms_var(--ease-out-strong)_both] flex-col items-center text-center text-white">
            {feedback.kind === "success" ? (
              <CheckCircle2 className="h-28 w-28 drop-shadow-md" strokeWidth={1.75} />
            ) : (
              <XCircle className="h-28 w-28 drop-shadow-md" strokeWidth={1.75} />
            )}
            <p className="mt-5 font-heading text-2xl font-semibold leading-tight">
              {feedback.title}
            </p>
            {feedback.sub && (
              <p className="mt-1.5 max-w-xs text-base opacity-95">{feedback.sub}</p>
            )}
            {feedback.kind === "error" && (
              <p className="mt-6 text-xs uppercase tracking-[0.18em] opacity-80">
                Toca para fechar
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
