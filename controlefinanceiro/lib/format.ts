export const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const fmt = (v: number) => BRL.format(v);

export const pad = (n: number) => String(n).padStart(2, "0");

/** Data local de hoje em "YYYY-MM-DD". */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" → "DD/MM/AAAA". */
export function br(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** "DD/MM/AAAA" → "YYYY-MM-DD", ou null se a data for inválida. */
export function fromBr(s: string): string | null {
  const r = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || "");
  if (!r) return null;
  const d = +r[1], mo = +r[2], y = +r[3];
  if (mo < 1 || mo > 12 || d < 1 || y < 2000 || d > new Date(y, mo, 0).getDate()) return null;
  return `${r[3]}-${r[2]}-${r[1]}`;
}

export function maskDate(v: string): string {
  const d = (v || "").replace(/\D/g, "").slice(0, 8);
  let o = d.slice(0, 2);
  if (d.length > 2) o += "/" + d.slice(2, 4);
  if (d.length > 4) o += "/" + d.slice(4);
  return o;
}

export const num2 = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Máscara de dinheiro: os dígitos digitados viram centavos ("12345" → "123,45"). */
export function maskMoney(v: string): string {
  const d = (v || "").replace(/\D/g, "").replace(/^0+/, "").slice(0, 11);
  return d ? num2(parseInt(d, 10) / 100) : "";
}

export const parseMoney = (s: string) =>
  s ? parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0 : 0;

export const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());

export const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/** Parcelas são gravadas como "Descrição (3/10)" — separa o rótulo da parcela. */
export function splitParcel(descricao: string): { desc: string; parcel: { n: number; total: number } | null } {
  const m = /^(.*)\s\((\d+)\/(\d+)\)$/.exec(descricao);
  if (!m) return { desc: descricao, parcel: null };
  return { desc: m[1], parcel: { n: +m[2], total: +m[3] } };
}

export const RECORRENCIAS = [
  { value: "unica", label: "Única" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
];

export const recurLabel = (v: string) => RECORRENCIAS.find((r) => r.value === v)?.label ?? v;

export const PALETTE: [string, string][] = [
  ["#4f7cac", "Azul"], ["#3f9a8f", "Verde-azulado"], ["#5b9a4a", "Verde"], ["#c49a2c", "Mostarda"],
  ["#d0803a", "Laranja"], ["#c4566a", "Rosa"], ["#b34848", "Vermelho"], ["#b05f9a", "Magenta"],
  ["#8a5fb8", "Roxo"], ["#5d6bc4", "Índigo"], ["#8a6d5a", "Marrom"], ["#6b7a86", "Cinza"],
];
