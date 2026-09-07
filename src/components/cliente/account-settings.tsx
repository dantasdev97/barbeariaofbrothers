"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Mail, Pencil, Phone, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setMyDisplayName, setMyPhone } from "@/lib/loyalty/client-actions";
import { formatPhonePTDisplay, PHONE_HINT } from "@/lib/loyalty/phone";
import { cn } from "@/lib/utils";

/**
 * A conta do cliente: como se chama e como o contactar.
 *
 * O nome só se podia escolher uma vez, no popup que aparecia com o cartão
 * acabado de criar — quem carregasse em "agora não" ficava com o nome que o
 * Google deu, sem volta. E o telefone não tinha caminho nenhum: quem entra
 * pela Google deixa email e mais nada, e a barbearia ficava sem forma de
 * avisar de uma marcação.
 *
 * Cada campo abre e fecha sozinho. Uma página inteira de definições para
 * dois campos era um sítio a mais para ir; assim editam-se aqui, ao lado do
 * cartão.
 */
export function AccountSettings({
  name,
  phone,
  email,
  onNameChange,
  className,
}: {
  name: string;
  /** Já em `+351XXXXXXXXX`, ou null. */
  phone: string | null;
  email: string | null;
  /** Avisa o cartão para mudar o nome à vista enquanto se escreve. */
  onNameChange?: (name: string) => void;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="font-heading text-[20px] font-semibold tracking-tight">
        A minha conta
      </h2>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-bg-surface">
        <EditableField
          icon={<User aria-hidden className="h-4 w-4" />}
          label="Nome"
          value={name}
          placeholder="Como quer ser tratado"
          inputMode="text"
          maxLength={60}
          emptyText="Sem nome"
          onSave={(v) => setMyDisplayName(v)}
          onDraftChange={onNameChange}
          successMessage={(v) => `Olá, ${v}!`}
        />

        <EditableField
          icon={<Phone aria-hidden className="h-4 w-4" />}
          label="Telefone"
          value={formatPhonePTDisplay(phone)}
          placeholder="912 345 678"
          inputMode="tel"
          maxLength={20}
          emptyText="Sem telefone"
          hint={`${PHONE_HINT} Serve para o avisarmos sobre a sua marcação — é opcional e pode retirá-lo quando quiser.`}
          allowEmpty
          onSave={(v) => setMyPhone(v)}
          successMessage={(v) => (v ? "Telefone guardado." : "Telefone removido.")}
        />

        {/* O email vem da conta com que iniciou sessão: mudá-lo aqui deixaria
         * a conta e o cartão a apontar para sítios diferentes. */}
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Mail aria-hidden className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Email
            </p>
            <p className="mt-0.5 truncate text-[14px]">
              {email ?? <span className="text-muted-foreground">Sem email</span>}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

type SaveResult = { ok: true } | { ok: false; error: string };

function EditableField({
  icon,
  label,
  value,
  placeholder,
  hint,
  emptyText,
  inputMode,
  maxLength,
  allowEmpty = false,
  onSave,
  onDraftChange,
  successMessage,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  hint?: string;
  emptyText: string;
  inputMode: "text" | "tel";
  maxLength: number;
  /** Guardar em branco apaga o valor (telefone). */
  allowEmpty?: boolean;
  onSave: (value: string) => Promise<SaveResult>;
  onDraftChange?: (value: string) => void;
  successMessage: (value: string) => string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();

  function open() {
    setDraft(value);
    setEditing(true);
  }

  function cancel() {
    setDraft(value);
    onDraftChange?.(value);
    setEditing(false);
  }

  function save() {
    const next = draft.trim();
    if (!next && !allowEmpty) return;
    startTransition(async () => {
      const result = await onSave(next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEditing(false);
      toast.success(successMessage(next));
      router.refresh();
    });
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          {editing ? (
            <Input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                onDraftChange?.(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !pending) save();
                if (e.key === "Escape") cancel();
              }}
              placeholder={placeholder}
              inputMode={inputMode}
              maxLength={maxLength}
              autoFocus
              autoComplete={inputMode === "tel" ? "tel" : "name"}
              aria-label={label}
              className="mt-1 h-11 text-base"
            />
          ) : (
            <p
              className={cn(
                "mt-0.5 truncate text-[14px]",
                !value && "text-muted-foreground",
              )}
            >
              {value || emptyText}
            </p>
          )}
        </div>

        {!editing && (
          <button
            type="button"
            onClick={open}
            aria-label={`Editar ${label.toLowerCase()}`}
            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.92] hover-fine:hover:bg-background hover-fine:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {editing && (
        <div className="px-5 pb-4">
          {hint && (
            <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {hint}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={cancel}
              disabled={pending}
              className="h-11 flex-1"
            >
              <X className="mr-1.5 h-4 w-4" /> Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={pending || (!draft.trim() && !allowEmpty)}
              className="h-11 flex-1 bg-brand text-primary-foreground hover:bg-brand-hover"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="mr-1.5 h-4 w-4" /> Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
