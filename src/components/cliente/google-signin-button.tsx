"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Entrada do cliente com a conta Google.
 *
 * O `next` viaja até ao `/auth/callback` para o utilizador voltar ao sítio
 * onde estava — normalmente o cartão que tentou reclamar antes de lhe
 * pedirmos login.
 *
 * O logo da Google é SVG inline de propósito: as regras de marca deles
 * exigem as cores exactas, e inline evita um pedido de rede que atrasaria
 * o único botão que interessa nesta página.
 */
export function GoogleSignInButton({
  next = "/minha-conta",
  unitSlug,
  label = "Continuar com Google",
  className,
}: {
  next?: string;
  /**
   * Barbearia de onde a pessoa veio. Guardado em cookie antes de sair para
   * a Google — ver a nota sobre o `next` abaixo.
   */
  unitSlug?: string;
  label?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    try {
      // O `next` viaja pelo Supabase, e é lá que se perde: se o URL pedido
      // não bater certo com a lista de "Redirect URLs" do projecto, o
      // Supabase ignora-o e manda para o Site URL, deitando fora a unidade.
      // O cookie não passa pelo Supabase, por isso sobrevive — e o
      // /auth/callback repõe a unidade a partir dele.
      if (unitSlug) {
        document.cookie = `ob_unidade=${encodeURIComponent(unitSlug)}; path=/; max-age=900; samesite=lax`;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      // Em caso de sucesso o browser navega para a Google — não desligamos
      // o pending, senão o botão "acorda" durante o redirect.
    } catch (err) {
      setPending(false);
      toast.error(
        err instanceof Error ? err.message : "Não foi possível entrar com a Google.",
      );
    }
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={pending}
      className={cn(
        "inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-5 text-[15px] font-semibold",
        "transition-[background-color,border-color,transform,opacity] duration-150 ease-out-strong",
        "hover-fine:hover:border-foreground/30 active:scale-[0.98] disabled:opacity-60",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z"
          />
        </svg>
      )}
      {pending ? "A entrar…" : label}
    </button>
  );
}
