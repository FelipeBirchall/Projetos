import crypto from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { NextRequest, NextResponse } from "next/server";
import { PASTA_DADOS } from "./armazenamento";

const DURACAO_MS = 12 * 60 * 60 * 1000; // 12 horas

let segredoEmCache: Buffer | null = null;

/** Segredo do servidor para lacrar o cookie. Vem do .env ou é gerado uma vez em data/. */
function segredo() {
  if (segredoEmCache) return segredoEmCache;
  let bruto = process.env.SESSION_SECRET;
  if (!bruto) {
    const arquivo = path.join(PASTA_DADOS, ".segredo-sessao");
    if (existsSync(arquivo)) {
      bruto = readFileSync(arquivo, "utf8").trim();
    } else {
      mkdirSync(PASTA_DADOS, { recursive: true });
      bruto = crypto.randomBytes(32).toString("hex");
      writeFileSync(arquivo, bruto, { encoding: "utf8", mode: 0o600 });
    }
  }
  segredoEmCache = crypto.createHash("sha256").update(bruto).digest();
  return segredoEmCache;
}

export type Sessao = { grupoId: string; participanteId: string; chave: string };

const nomeCookie = (grupoId: string) => `treno_${grupoId}`;

function lacrar(dados: object) {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv("aes-256-gcm", segredo(), iv);
  const corpo = Buffer.concat([cifra.update(JSON.stringify(dados), "utf8"), cifra.final()]);
  return Buffer.concat([iv, cifra.getAuthTag(), corpo]).toString("base64url");
}

function abrir(valor: string): unknown {
  try {
    const bruto = Buffer.from(valor, "base64url");
    const decifra = crypto.createDecipheriv("aes-256-gcm", segredo(), bruto.subarray(0, 12));
    decifra.setAuthTag(bruto.subarray(12, 28));
    const texto = Buffer.concat([decifra.update(bruto.subarray(28)), decifra.final()]);
    return JSON.parse(texto.toString("utf8"));
  } catch {
    return null;
  }
}

function ehHttps(req: NextRequest) {
  return req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
}

/**
 * O cookie guarda a chave derivada da senha, lacrada (AES-GCM) com o segredo do servidor.
 * Assim a pessoa não precisa digitar a senha a cada clique, e a chave nunca vai ao JSON.
 */
export function iniciarSessao(req: NextRequest, res: NextResponse, s: Sessao) {
  const valor = lacrar({ g: s.grupoId, p: s.participanteId, k: s.chave, exp: Date.now() + DURACAO_MS });
  res.cookies.set(nomeCookie(s.grupoId), valor, {
    httpOnly: true,
    sameSite: "strict",
    secure: ehHttps(req),
    path: "/",
    maxAge: DURACAO_MS / 1000,
  });
}

export function encerrarSessao(res: NextResponse, grupoId: string) {
  res.cookies.set(nomeCookie(grupoId), "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function lerSessao(req: NextRequest, grupoId: string): Sessao | null {
  const valor = req.cookies.get(nomeCookie(grupoId))?.value;
  if (!valor) return null;
  const dados = abrir(valor) as { g: string; p: string; k: string; exp: number } | null;
  if (!dados || dados.g !== grupoId || dados.exp < Date.now()) return null;
  return { grupoId: dados.g, participanteId: dados.p, chave: dados.k };
}
