"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

// qr-scanner é um SSR-incompatível (usa Worker), por isso carregamos
// dinamicamente no useEffect só no client.
type QrScannerModule = typeof import("qr-scanner");
type QrScannerInstance = InstanceType<QrScannerModule["default"]>;

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
  const scannerRef = useRef<QrScannerInstance | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const native = useIsNative();

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, []);

  // App nativa (Capacitor): usa o scanner ML Kit nativo em vez do qr-scanner web.
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

  async function start() {
    if (native) return startNative();
    if (!videoRef.current) return;
    setLoading(true);
    try {
      const QrScannerMod = (await import("qr-scanner")).default;

      // O worker do qr-scanner precisa ser servido. A v1.4 funciona via
      // import direto (Next/webpack inlines o worker).
      const scanner = new QrScannerMod(
        videoRef.current,
        (result) => {
          const handle = extractHandle(result.data);
          if (handle) goTo(handle);
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        },
      );
      await scanner.start();
      scannerRef.current = scanner;
      setRunning(true);
    } catch (err) {
      console.error("[scanner]", err);
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
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setRunning(false);
  }

  async function goTo(handle: string) {
    stop();
    setLoading(true);
    try {
      const res = await lookupClient(handle);
      if (res.ok) {
        setFeedback({ kind: "success", title: "Cartão encontrado", sub: res.name });
        // breve flash verde antes de navegar
        setTimeout(() => {
          router.push(`/admin/operacao/cliente/${res.handle}`);
        }, 750);
      } else {
        setFeedback({ kind: "error", title: "Cartão inválido", sub: res.error });
        // auto-dismiss ao fim de 2.5s para o operador poder voltar a tentar
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

      {!native && (
        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          <video
            ref={videoRef}
            className="aspect-square w-full bg-black object-cover"
            playsInline
            muted
          />
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
          : "A câmara só funciona em HTTPS (ou localhost). Tem de permitir o acesso quando o browser pedir."}
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
          onClick={
            feedback.kind === "error" ? () => setFeedback(null) : undefined
          }
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center p-6 transition-opacity",
            feedback.kind === "success"
              ? "bg-emerald-500/95"
              : "bg-red-500/95 cursor-pointer",
          )}
        >
          <div className="flex flex-col items-center text-center text-white">
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
