/**
 * Intervalos de datas do painel, no fuso da barbearia.
 *
 * O servidor corre em UTC e a barbearia é em Portugal: sem fuso explícito,
 * "hoje" começava à uma da manhã no Verão e a actividade das 00h30 aparecia
 * com a data de ontem. Tudo o que aqui se calcula — limites do intervalo,
 * chaves de dia, rótulos — passa por `Europe/Lisbon`.
 */

export const TZ = "Europe/Lisbon";

/** "2026-09-07" no fuso de Lisboa. Chave de agrupamento por dia. */
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
/** "2026-09-07 13:00:00" — usado só para descobrir o desvio do fuso. */
const localStampFmt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const shortDayFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
});

export function dayKey(date: Date = new Date()): string {
  return dayKeyFmt.format(date);
}

/** "2026-09-07" + n dias, sem escorregar na mudança da hora. */
export function shiftDayKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Instante (ISO/UTC) em que começa esse dia em Lisboa.
 *
 * A meia-noite local não é a meia-noite UTC: descobre-se o desvio pedindo ao
 * `Intl` como se lê, nesse fuso, o instante da meia-noite UTC do mesmo dia.
 */
export function dayStartISO(key: string): string {
  const utcMidnight = new Date(`${key}T00:00:00Z`).getTime();
  const asLocal = localStampFmt.format(new Date(utcMidnight));
  const offset =
    new Date(`${asLocal.replace(" ", "T")}Z`).getTime() - utcMidnight;
  return new Date(utcMidnight - offset).toISOString();
}

/** Presets do filtro. O valor é o número de dias, contando com hoje. */
export const PRESETS = [
  { value: "1", label: "Hoje" },
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
] as const;

export const DEFAULT_PRESET = "30";

/** Máximo de pontos num sparkline — mais do que isto não se lê. */
const MAX_SERIES_DAYS = 92;

export type DateRange = {
  /** Início do intervalo, inclusivo (ISO/UTC). */
  fromISO: string;
  /** Fim do intervalo, **exclusivo** (ISO/UTC): use `lt`, não `lte`. */
  toISO: string;
  /** Dias no intervalo, contando com o primeiro e o último. */
  days: number;
  /** Primeiro dia, "2026-08-09". */
  fromKey: string;
  /** Último dia do intervalo (inclusivo), "2026-09-07". */
  toKey: string;
  /** "30 dias" ou "9 ago – 7 set". Para os rótulos dos cartões. */
  label: string;
  /** Preset activo, ou null quando o intervalo é personalizado. */
  preset: string | null;
  /** Parâmetros a preservar nos links (paginação, filtros). */
  params: { dias?: string; de?: string; ate?: string };
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidKey(value: string | undefined): value is string {
  if (!value || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Resolve o intervalo a partir dos parâmetros do URL.
 *
 * Um intervalo personalizado (`de`/`ate`) ganha ao preset. Datas inválidas ou
 * invertidas não rebentam nada: caem no preset por omissão, porque estes
 * valores vêm do URL e qualquer pessoa lhes pode mexer.
 */
export function resolveRange({
  dias,
  de,
  ate,
}: {
  dias?: string;
  de?: string;
  ate?: string;
}): DateRange {
  const today = dayKey();

  if (isValidKey(de)) {
    // Sem `ate`, o intervalo vai de `de` até hoje.
    let toKey = isValidKey(ate) ? ate : today;
    // Datas trocadas pela pessoa: em vez de devolver zero resultados sem
    // explicação, endireita-se o intervalo.
    let fromKey = de;
    if (toKey < fromKey) [fromKey, toKey] = [toKey, fromKey];
    // Futuro não tem eventos; encurtar mantém o gráfico com escala útil.
    if (toKey > today) toKey = today;

    const days = Math.max(
      1,
      Math.round(
        (Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) /
          86_400_000,
      ) + 1,
    );

    return {
      fromISO: dayStartISO(fromKey),
      toISO: dayStartISO(shiftDayKey(toKey, 1)),
      days,
      fromKey,
      toKey,
      label:
        fromKey === toKey
          ? shortDayFmt.format(new Date(`${fromKey}T12:00:00Z`))
          : `${shortDayFmt.format(new Date(`${fromKey}T12:00:00Z`))} – ${shortDayFmt.format(
              new Date(`${toKey}T12:00:00Z`),
            )}`,
      preset: null,
      params: { de: fromKey, ate: toKey },
    };
  }

  const preset =
    PRESETS.find((p) => p.value === dias)?.value ?? DEFAULT_PRESET;
  const days = Number(preset);
  const fromKey = shiftDayKey(today, -(days - 1));

  return {
    fromISO: dayStartISO(fromKey),
    toISO: dayStartISO(shiftDayKey(today, 1)),
    days,
    fromKey,
    toKey: today,
    label: PRESETS.find((p) => p.value === preset)!.label.toLowerCase(),
    preset,
    params: preset === DEFAULT_PRESET ? {} : { dias: preset },
  };
}

/**
 * Contagens por dia dentro do intervalo, do mais antigo ao mais recente.
 *
 * Devolve sempre um ponto por dia — dias sem eventos entram a zero, senão o
 * sparkline comprimia os intervalos e distorcia a leitura. Intervalos muito
 * longos são reduzidos: 365 pontos em 100px de largura são ruído.
 */
export function dailySeries<T>(
  rows: T[],
  range: DateRange,
  dateOf: (row: T) => string,
  valueOf: (row: T) => number = () => 1,
): number[] {
  const days = Math.min(range.days, MAX_SERIES_DAYS);
  const buckets = new Array<number>(days).fill(0);
  const index = new Map<string, number>();
  // Ancorado no fim do intervalo: quando se corta, o que se perde é o começo.
  for (let i = 0; i < days; i++) {
    index.set(shiftDayKey(range.toKey, -(days - 1 - i)), i);
  }
  for (const row of rows) {
    const i = index.get(dayKey(new Date(dateOf(row))));
    if (i !== undefined) buckets[i] += valueOf(row);
  }
  return buckets;
}
