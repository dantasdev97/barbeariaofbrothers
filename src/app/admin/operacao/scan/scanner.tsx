"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  RefreshCw,
  ScanLine,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupClient } from "@/lib/loyalty/actions";
import { extractHandle } from "@/lib/loyalty/handle";
import { useIsNative } from "@/lib/native/platform";
import { cn } from "@/lib/utils";
import { ScanFrame, type ScanPhase } from "./scan-frame";

type Feedback = {
  kind: "success" | "error";
  title: string;
  sub?: string;
};

/**
 * Lado máximo (px) do frame enviado ao descodificador.
 *
 * Medido, não adivinhado: reduzir a imagem funciona como filtro passa-baixo e
 * faz a média do ruído do sensor, e o jsQR lê melhor assim do que com um
 * recorte em resolução quase nativa. Numa bateria de frames sintéticos com
 * desfoque e ruído, 640 lê 83% e a taxa cai monotonicamente até 28% a 1000px.
 * Um recorte central à mesma escala efetiva acerta exactamente nos mesmos
 * frames, por isso não vale a segunda passagem.
 */
const DECODE_MAX_SIDE = 640;
/** Exceções seguidas antes de desistir: uma falha isolada não deve matar o scan. */
const MAX_CONSECUTIVE_ERRORS = 30;
/** Depois disto sem leitura, sugerimos a entrada manual. */
const HINT_AFTER_MS = 12_000;

/**
 * `requestVideoFrameCallback` só existe em browsers recentes. Onde existe é
 * melhor que `requestAnimationFrame`: dispara por frame *da câmara* e não por
 * frame *do ecrã*, e não é suspenso quando o elemento sai de vista.
 */
type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export function Scanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const vfcRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handledRef = useRef(false);
  const stoppedRef = useRef(false);
  const errorsRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const native = useIsNative();

  /**
   * Pára o loop e liberta a câmara, mas **não** limpa o `srcObject`.
   *
   * Parar as tracks deixa o `<video>` no último frame; limpar o `srcObject` é
   * que o apaga para preto. Ao detectar um QR queremos exactamente a primeira
   * coisa — a imagem congela como numa fotografia enquanto validamos, em vez
   * de o ecrã apagar durante a ida ao servidor.
   */
  const stopStream = useCallback(() => {
    stoppedRef.current = true;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const video = videoRef.current as VideoWithFrameCallback | null;
    if (vfcRef.current !== null) {
      video?.cancelVideoFrameCallback?.(vfcRef.current);
      vfcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  /** Como `stopStream`, e ainda apaga a imagem. Para quando não vamos voltar. */
  const releaseVideo = useCallback(() => {
    stopStream();
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stopStream]);

  // Cleanup ao desmontar
  useEffect(() => releaseVideo, [releaseVideo]);

  // Sugestão de entrada manual quando a leitura demora. Sem isto, uma câmara
  // que nunca lê não dá qualquer sinal ao barbeiro — fica só a imagem.
  // A reposição do aviso é feita em `start()`, não aqui: a renderização já
  // exige `running`, e chamar setState no corpo do efeito provoca renders em
  // cascata.
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setShowHint(true), HINT_AFTER_MS);
    return () => clearTimeout(id);
  }, [running]);

  const goTo = useCallback(
    async (handle: string) => {
      // Congela a imagem em vez de a apagar: entre detectar o QR e ter a
      // resposta do servidor o ecrã mostrava preto, o pior momento possível
      // para não dar sinal nenhum.
      stopStream();
      setRunning(false);
      setShowHint(false);
      setValidating(true);
      setLoading(true);
      try {
        const res = await lookupClient(handle);
        if (res.ok) {
          setFeedback({ kind: "success", title: "Cartão encontrado", sub: res.name });
          setTimeout(() => {
            router.push(`/admin/operacao/cliente/${res.handle}`);
          }, 750);
        } else {
          releaseVideo();
          setFeedback({ kind: "error", title: "Cartão inválido", sub: res.error });
          setTimeout(() => setFeedback(null), 2500);
        }
      } catch (err) {
        console.error("[scanner:lookup]", err);
        releaseVideo();
        setFeedback({
          kind: "error",
          title: "Erro",
          sub: err instanceof Error ? err.message : "Falhou a validação.",
        });
        setTimeout(() => setFeedback(null), 2500);
      } finally {
        setValidating(false);
        setLoading(false);
      }
    },
    [router, stopStream, releaseVideo],
  );

  // App nativa (Capacitor): usa o scanner ML Kit nativo.
  async function startNative() {
    setLoading(true);
    setStatus(null);
    try {
      const { BarcodeScanner, BarcodeFormat } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );

      // Sem este teste, num dispositivo sem suporte o `scan()` abre a câmara e
      // nunca devolve nada.
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        toast.error("Scanner nativo indisponível neste dispositivo.");
        return;
      }

      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== "granted" && camera !== "limited") {
        toast.error("Permissão de câmara recusada.");
        return;
      }

      // O módulo de barcode do Google Play Services é descarregado a pedido.
      // Se faltar, `scan()` mostra a câmara e nunca deteta nada.
      try {
        const { available } =
          await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
          setStatus("A instalar leitor…");
          await BarcodeScanner.installGoogleBarcodeScannerModule();
        }
      } catch {
        // iOS não tem este módulo — a rejeição aqui é esperada.
      } finally {
        setStatus(null);
      }

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });
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
      setStatus(null);
      setLoading(false);
    }
  }

  // Web: jsQR sobre os frames do vídeo (sem worker — fiável em iOS Safari).
  async function start() {
    if (native) return startNative();
    const video = videoRef.current as VideoWithFrameCallback | null;
    if (!video) return;
    setLoading(true);
    handledRef.current = false;
    stoppedRef.current = false;
    errorsRef.current = 0;
    setShowHint(false);
    try {
      const jsQR = (await import("jsqr")).default;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          // Pedir mais do que vamos descodificar é deliberado: garante que a
          // redução para DECODE_MAX_SIDE acontece, e é essa redução que faz a
          // média do ruído do sensor. Medido em frames com desfoque e ruído,
          // uma câmara 640×480 lida em tamanho nativo lê 33%, enquanto
          // 1280×720 reduzida para 640 lê 67%.
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        // Falhar alto: antes o loop saía em silêncio e a câmara ficava a rodar.
        throw new Error("Canvas 2D indisponível neste browser.");
      }
      setRunning(true);

      /** Descodifica o frame atual reduzido. Devolve o texto do QR ou null. */
      const decodeFrame = (v: HTMLVideoElement): string | null => {
        const scale = Math.min(1, DECODE_MAX_SIDE / Math.max(v.videoWidth, v.videoHeight));
        const w = Math.max(1, Math.round(v.videoWidth * scale));
        const h = Math.max(1, Math.round(v.videoHeight * scale));
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(v, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);
        const code = jsQR(img.data, w, h, { inversionAttempts: "attemptBoth" });
        return code?.data ?? null;
      };

      const schedule = () => {
        if (handledRef.current || stoppedRef.current) return;
        if (typeof video.requestVideoFrameCallback === "function") {
          vfcRef.current = video.requestVideoFrameCallback(tick);
        } else {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      const tick = () => {
        if (handledRef.current || stoppedRef.current) return;
        // Tudo dentro de try/finally: uma exceção num frame não pode matar o
        // loop. Era esta a razão de a câmara ficar viva sem nunca ler nada.
        try {
          const v = videoRef.current;
          if (v && v.readyState >= 2 && v.videoWidth && v.videoHeight) {
            const data = decodeFrame(v);
            if (data) {
              const handle = extractHandle(data);
              if (handle) {
                handledRef.current = true;
                goTo(handle);
                return;
              }
            }
            errorsRef.current = 0;
          }
        } catch (err) {
          errorsRef.current++;
          console.error(
            `[scanner:decode] falha ${errorsRef.current}/${MAX_CONSECUTIVE_ERRORS}`,
            err,
          );
          if (errorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
            releaseVideo();
            setRunning(false);
            toast.error(
              err instanceof Error
                ? `Descodificação falhou: ${err.message}`
                : "Descodificação falhou.",
            );
            return;
          }
        } finally {
          schedule();
        }
      };

      schedule();
    } catch (err) {
      console.error("[scanner]", err);
      releaseVideo();
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
    releaseVideo();
    setRunning(false);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const t = extractHandle(manual);
    if (!t) return toast.error("Cola o link ou o handle do cartão.");
    goTo(t);
  }

  /**
   * Fase visível da mira. `validating` tem precedência: assim que o QR é
   * detectado o alvo trava, mesmo que o resto do estado ainda esteja a assentar.
   */
  const phase: "idle" | ScanPhase = validating
    ? "found"
    : running
      ? "scanning"
      : loading
        ? "starting"
        : "idle";

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
        <div className="relative overflow-hidden rounded-2xl border border-border bg-[#0b0b0c]">
          <video
            ref={videoRef}
            className="aspect-square w-full object-cover"
            playsInline
            muted
          />

          {/* Parado: o quadrado preto não dizia nada. Um alvo desenhado deixa
           * claro o que vai acontecer e mantém a mesma composição de quando a
           * câmara liga — não há salto ao arrancar. */}
          {phase === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/45">
              <Camera className="h-9 w-9" strokeWidth={1.5} />
              <p className="text-[12.5px]">Câmara desligada</p>
            </div>
          )}

          {phase !== "idle" && <ScanFrame phase={phase} />}

          {/* Etiqueta de estado. Fica na base para não tapar a mira. */}
          {(phase === "starting" || phase === "found") && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
              <div className="animate-enter-up flex items-center gap-2.5 rounded-full bg-black/70 px-4 py-2.5 text-[13px] font-medium text-white backdrop-blur-sm">
                {/* O spinner segue a cor da mira: laranja a preparar, verde
                 * depois de travar no cartão. */}
                <Loader2
                  className={cn(
                    "h-4 w-4 animate-spin",
                    phase === "found" ? "text-emerald-400" : "text-brand",
                  )}
                />
                {phase === "starting"
                  ? (status ?? "A ligar a câmara…")
                  : "A validar cartão…"}
              </div>
            </div>
          )}

          {/* Enquanto procura, dizer que está a procurar — sem tapar a imagem. */}
          {phase === "scanning" && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
              <div className="animate-enter-up flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-2 text-[12.5px] font-medium text-white/90 backdrop-blur-sm">
                <ScanLine className="h-3.5 w-3.5 text-brand" />À procura do QR
              </div>
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
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{" "}
                {status ?? (validating ? "A validar…" : "A iniciar…")}
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

      {/* Sem este aviso, uma câmara que não lê é indistinguível de uma câmara
       * avariada — o barbeiro não tinha forma de saber o que fazer. */}
      {showHint && running && (
        <div className="mt-3 rounded-xl border border-brand/40 bg-brand/5 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Ainda não li o QR.</p>
          <p className="mt-1.5">
            Espera que a câmara focar, evita reflexos e baixa o brilho do ecrã do
            cliente se estiver ao máximo. Se não resultar, usa a entrada manual
            abaixo.
          </p>
        </div>
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
            {/* O ícone entra um pouco depois do fundo e com escala própria: o
             * fundo estabelece o veredicto, o ícone confirma-o. Tudo ao mesmo
             * tempo lia-se como um piscar. */}
            <div className="animate-pop-in [animation-delay:60ms]">
              {feedback.kind === "success" ? (
                <CheckCircle2 className="h-28 w-28 drop-shadow-md" strokeWidth={1.75} />
              ) : (
                <XCircle className="h-28 w-28 drop-shadow-md" strokeWidth={1.75} />
              )}
            </div>
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
