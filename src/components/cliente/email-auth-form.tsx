"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

/** O mínimo que o Supabase aceita. Validado aqui para o erro vir em português. */
const MIN_PASSWORD = 6;

/**
 * Traduz o que a API devolve. Sem isto o cliente lê inglês técnico no meio
 * de uma página em português.
 */
function toMessage(raw: string): string {
  if (/Invalid login credentials/i.test(raw)) return "Email ou palavra-passe errados.";
  if (/User already registered/i.test(raw)) {
    return "Já existe conta com este email. Entre em vez de criar.";
  }
  if (/Email not confirmed/i.test(raw)) {
    return "Falta confirmar o email. Verifique a sua caixa de correio.";
  }
  if (/Password should be at least/i.test(raw)) {
    return `A palavra-passe precisa de pelo menos ${MIN_PASSWORD} caracteres.`;
  }
  if (/rate limit|too many/i.test(raw)) {
    return "Demasiadas tentativas. Aguarde um pouco e tente de novo.";
  }
  return raw;
}

/**
 * Entrada por email — alternativa à Google, para quem não tem conta Google
 * ou simplesmente não a quer usar.
 *
 * O `next` traz a barbearia (`?unidade=`) e é para lá que navegamos depois
 * de entrar: é isso que faz o cartão nascer sozinho em vez de cair no ecrã
 * a perguntar a unidade.
 */
export function EmailAuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  /**
   * Email a que foi enviada a confirmação. Estado do ecrã e não um `toast`:
   * a pessoa precisa de continuar a ver isto enquanto vai à caixa de correio.
   */
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return toast.error("Escreva o seu email.");
    if (password.length < MIN_PASSWORD) {
      return toast.error(`A palavra-passe precisa de pelo menos ${MIN_PASSWORD} caracteres.`);
    }
    if (isSignup && !name.trim()) return toast.error("Escreva o seu nome.");

    setPending(true);
    try {
      const supabase = createClient();
      const { data, error } = isSignup
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            // `full_name` tem de ir aqui: é de `raw_user_meta_data` que a
            // função que cria o cartão tira o nome. Sem isto o cartão
            // nasceria com a parte do email antes do @.
            options: { data: { full_name: name.trim() } },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (error) throw error;

      // Com a confirmação de email ligada no Supabase, o `signUp` devolve
      // utilizador **sem sessão** e sem erro. Navegar aqui mandava a pessoa
      // para /minha-conta, que a devolvia a este ecrã sem dizer porquê — era
      // exactamente o que acontecia ao criar conta.
      if (!data.session) {
        setPending(false);
        setAwaitingConfirmation(email.trim());
        return;
      }

      // Carregamento completo e não `router.push` + `router.refresh()`: os dois
      // seguidos arriscam o refresh abortar a navegação, e o pedido ao servidor
      // tem de levar o cookie de sessão acabado de escrever.
      window.location.assign(next);
    } catch (err) {
      setPending(false);
      toast.error(
        toMessage(err instanceof Error ? err.message : "Não foi possível entrar."),
      );
    }
  }

  async function resendConfirmation() {
    if (!awaitingConfirmation) return;
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: awaitingConfirmation,
      });
      if (error) throw error;
      toast.success("Email reenviado.");
    } catch (err) {
      toast.error(
        toMessage(err instanceof Error ? err.message : "Não foi possível reenviar."),
      );
    } finally {
      setPending(false);
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      return toast.error("Escreva o seu email primeiro, para lhe enviarmos o link.");
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir`,
      });
      if (error) throw error;
      toast.success("Enviámos um link para o seu email.");
    } catch (err) {
      toast.error(
        toMessage(err instanceof Error ? err.message : "Não foi possível enviar."),
      );
    } finally {
      setPending(false);
    }
  }

  // Conta criada, falta confirmar. Substitui o formulário: deixá-lo à vista
  // convidava a tentar entrar outra vez, que é justamente o que ainda não
  // resulta.
  if (awaitingConfirmation) {
    return (
      <div className="rounded-2xl border border-brand/40 bg-brand/5 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-heading text-lg font-semibold leading-tight">
          Confirme o seu email
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          Enviámos um link para{" "}
          <strong className="font-medium text-foreground">{awaitingConfirmation}</strong>.
          Abra-o para activar a conta e receber os seus pontos de boas-vindas.
        </p>
        <Button
          onClick={resendConfirmation}
          disabled={pending}
          variant="outline"
          className="mt-5 h-11 w-full"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A reenviar…
            </>
          ) : (
            "Reenviar email"
          )}
        </Button>
        <button
          type="button"
          onClick={() => {
            setAwaitingConfirmation(null);
            setMode("signin");
            setPassword("");
          }}
          className="mt-3 min-h-11 w-full text-[13px] text-muted-foreground underline underline-offset-2 transition-colors duration-150 hover-fine:hover:text-foreground"
        >
          Já confirmei — entrar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Alternador de modo */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-bg-surface p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`min-h-11 rounded-lg text-sm font-semibold transition-[background-color,color] duration-150 ease-out-strong ${
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover-fine:hover:text-foreground"
            }`}
          >
            {m === "signin" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {isSignup && (
          <div>
            <label htmlFor="auth-name" className="mb-1.5 block text-[13px] font-medium">
              Nome
            </label>
            <Input
              id="auth-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como quer ser tratado"
              autoComplete="name"
              className="h-11"
            />
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-[13px] font-medium">
            Email
          </label>
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.pt"
            autoComplete="email"
            inputMode="email"
            className="h-11"
          />
        </div>

        <div>
          <label htmlFor="auth-password" className="mb-1.5 block text-[13px] font-medium">
            Palavra-passe
          </label>
          <Input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="h-11"
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="h-12 w-full bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSignup ? "A criar…" : "A entrar…"}
            </>
          ) : isSignup ? (
            "Criar conta"
          ) : (
            "Entrar"
          )}
        </Button>

        {!isSignup && (
          <button
            type="button"
            onClick={forgotPassword}
            disabled={pending}
            className="min-h-11 w-full text-[13px] text-muted-foreground underline underline-offset-2 transition-colors duration-150 hover-fine:hover:text-foreground disabled:opacity-60"
          >
            Esqueci-me da palavra-passe
          </button>
        )}
      </form>
    </div>
  );
}
