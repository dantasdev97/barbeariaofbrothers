"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      const { error } = isSignup
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

      router.push(next);
      router.refresh();
    } catch (err) {
      setPending(false);
      toast.error(
        toMessage(err instanceof Error ? err.message : "Não foi possível entrar."),
      );
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
