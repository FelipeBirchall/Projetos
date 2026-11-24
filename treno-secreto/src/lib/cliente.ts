// Utilitários usados só no navegador.
import { useMemo, useSyncExternalStore } from "react";

const semAssinatura = () => () => {};

/** Endereço do site (ex.: http://localhost:3000). Vazio durante a renderização no servidor. */
export function useOrigem() {
  return useSyncExternalStore(semAssinatura, () => window.location.origin, () => "");
}

/** Valor depois do "#" na URL. null durante a renderização no servidor. */
export function useHash() {
  return useSyncExternalStore(
    (avisar) => {
      window.addEventListener("hashchange", avisar);
      return () => window.removeEventListener("hashchange", avisar);
    },
    () => decodeURIComponent(window.location.hash.slice(1)),
    () => null,
  );
}

export function useGruposSalvos(): GrupoSalvo[] {
  const bruto = useSyncExternalStore(
    (avisar) => {
      window.addEventListener("storage", avisar);
      return () => window.removeEventListener("storage", avisar);
    },
    () => localStorage.getItem(CHAVE_GRUPOS_SALVOS) ?? "[]",
    () => "[]",
  );
  return useMemo(() => {
    try {
      return JSON.parse(bruto);
    } catch {
      return [];
    }
  }, [bruto]);
}

export type InfoGrupo = {
  id: string;
  nome: string;
  dataTroca: string;
  /** Em centavos; null = sem limite. */
  valorMinimo: number | null;
  valorMaximo: number | null;
  /** Texto livre de grupos antigos (antes da faixa mínimo/máximo). */
  valorSugerido: string;
  prazoCadastro: string | null;
  status: "aberto" | "sorteado";
  cadastroAberto: boolean;
  participantes: { nome: string }[];
};

/** 5000 → "R$ 50"; 4990 → "R$ 49,90". */
export function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: centavos % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Texto da faixa de valor do presente, ou "" se o grupo não definiu nenhuma. */
export function faixaDeValor(g: Pick<InfoGrupo, "valorMinimo" | "valorMaximo" | "valorSugerido">) {
  const { valorMinimo: min, valorMaximo: max } = g;
  if (min != null && max != null) {
    return min === max ? formatarReais(min) : `${formatarReais(min)} a ${formatarReais(max)}`;
  }
  if (min != null) return `A partir de ${formatarReais(min)}`;
  if (max != null) return `Até ${formatarReais(max)}`;
  return g.valorSugerido ?? "";
}

export class ErroApi extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

export async function api<T>(
  url: string,
  opcoes: { metodo?: string; corpo?: unknown; adminToken?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opcoes.corpo !== undefined) headers["Content-Type"] = "application/json";
  if (opcoes.adminToken) headers["x-admin-token"] = opcoes.adminToken;
  const res = await fetch(url, {
    method: opcoes.metodo ?? "GET",
    headers,
    body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErroApi(res.status, dados.erro ?? "Algo deu errado. Tente novamente.");
  return dados as T;
}

/** Links de organizador ficam guardados só no navegador de quem criou o grupo. */
export type GrupoSalvo = { id: string; nome: string; token: string };
export const CHAVE_GRUPOS_SALVOS = "treno-meus-grupos";

export function lerGruposSalvos(): GrupoSalvo[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_GRUPOS_SALVOS) || "[]");
  } catch {
    return [];
  }
}

export function formatarData(iso: string | null) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function soltarConfete() {
  const formas = ["fita", "fita", "bolinha", "estrelinha"];
  const cores = ["#e0273f", "#f4c443", "#2e9b5a", "#ffffff", "#4dabff", "#ff8cd9"];
  for (let i = 0; i < 110; i++) {
    const el = document.createElement("span");
    const peca = document.createElement("i");
    el.className = `confete ${formas[i % formas.length]}`;
    peca.style.background = cores[i % cores.length];
    peca.style.animationDuration = `${0.6 + Math.random() * 1.2}s`;
    el.appendChild(peca);
    const duracao = 2.4 + Math.random() * 2;
    el.style.left = `${Math.random() * 100}vw`;
    el.style.animationDuration = `${duracao}s`;
    el.style.animationDelay = `${Math.random() * 0.6}s`;
    el.style.setProperty("--dx", `${(Math.random() - 0.5) * 260}px`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), (duracao + 0.8) * 1000);
  }
}
