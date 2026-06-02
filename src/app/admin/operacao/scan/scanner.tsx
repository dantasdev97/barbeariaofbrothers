"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Camera, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gotoClientByToken } from "@/lib/loyalty/actions";

// qr-scanner é um SSR-incompatível (usa Worker), por isso carregamos
// dinamicamente no useEffect só no client.
type QrScannerModule = typeof import("qr-scanner");
type QrScannerInstance = InstanceType<QrScannerModule["default"]>;

function extractHandle(value: string): string {
  // Aceita URL completa ou só handle (slug minúsculo OU token maiúsculo)
  const m = value.match(/cliente\/([A-Za-z0-9-]+)/);
  return (m?.[1] ?? value).trim();
}

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScannerInstance | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState("");
  const [pending, startTransition] = useTransition();

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

  async function start() {
    if (!videoRef.current) return;
    setLoading(true);
    try {
      const QrScannerMod = (await import("qr-scanner")).default;
      // Set worker path before instantiation so production builds resolve it.
      QrScannerMod.WORKER_PATH = "/qr-scanner-worker.min.js";

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

  function goTo(handle: string) {
    stop();
    startTransition(async () => {
      try {
        await gotoClientByToken(handle);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Cartão inválido.");
      }
    });
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
            disabled={pending || loading}
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
        A câmara só funciona em HTTPS (ou localhost). Tem de permitir o acesso quando o
        browser pedir.
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
          disabled={pending || !manual.trim()}
          className="w-full bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          Abrir cartão
        </Button>
      </form>
    </div>
  );
}
