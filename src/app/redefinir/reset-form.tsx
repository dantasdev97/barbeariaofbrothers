"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD = 6;

/**
 * Define a palavra-passe nova.
 *
 * Chega-se aqui pelo link do email de recuperação: o Supabase troca o
 * token por uma sessão ao abrir a página, e é essa sessão que autoriza o
 * `updateUser`. Por isso não se pede a palavra-passe antiga — quem
 * esqueceu não a tem.
 */
export function ResetForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      return toast.error(`A palavra-passe precisa de pelo menos ${MIN_PASSWORD} caracteres.`);
    }
    if (password !== confirm) return toast.error("As duas palavras-passe não coincidem.");

    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Palavra-passe alterada.");
      router.push("/minha-conta");
      router.refresh();
    } catch (err) {
      setPending(false);
      const raw = err instanceof Error ? err.message : "";
      toast.error(
        /Auth session missing|session_not_found|expired/i.test(raw)
          ? "O link expirou. Peça um novo em Entrar."
          : raw || "Não foi possível alterar a palavra-passe.",
      );
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-3">
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-[13px] font-medium">
          Palavra-passe nova
        </label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
          autoComplete="new-password"
          className="h-11"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-[13px] font-medium">
          Repetir
        </label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
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
            A guardar…
          </>
        ) : (
          "Guardar palavra-passe"
        )}
      </Button>
    </form>
  );
}
