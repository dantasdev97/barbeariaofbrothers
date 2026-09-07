import { cn } from "@/lib/utils";

/**
 * Foto do cliente, com as iniciais como recurso quando não há.
 *
 * Estava copiada na lista de clientes e na ficha, e faltava em todo o lado
 * onde um cliente também aparece — a busca da operação e o extracto da
 * fidelidade mostravam só um nome. Ao balcão, a foto é o que confirma que se
 * está a lançar pontos na pessoa certa.
 *
 * Sem `next/image` de propósito: as fotos são do Google
 * (`lh3.googleusercontent.com`) e não estão nos `remotePatterns`, o que faria
 * o componente do Next atirar durante a renderização. Aqui é um `<img>` de
 * 32–56px; não há nada a optimizar.
 *
 * `referrerPolicy="no-referrer"`: o Google devolve 403 a pedidos de fotos de
 * perfil que cheguem com Referer de outro domínio.
 */

const SIZES = {
  sm: { box: "h-8 w-8", text: "text-[11px]" },
  md: { box: "h-9 w-9", text: "text-[12px]" },
  lg: { box: "h-14 w-14", text: "text-lg" },
} as const;

export function ClientAvatar({
  name,
  url,
  size = "sm",
  className,
}: {
  name: string;
  url: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className={cn("shrink-0 rounded-full object-cover", s.box, className)}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand",
        s.box,
        s.text,
        size === "lg" && "font-heading",
        className,
      )}
    >
      {initials || "?"}
    </div>
  );
}
