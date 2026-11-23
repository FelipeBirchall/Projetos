import crypto from "crypto";
import { promisify } from "util";
import type { Participante } from "./tipos";

const scrypt = promisify(crypto.scrypt) as (
  senha: string,
  salt: string,
  tamanho: number,
) => Promise<Buffer>;
const gerarParDeChaves = promisify(crypto.generateKeyPair);

const ALFABETO_ID = "abcdefghijklmnopqrstuvwxyz0123456789";

export function novoId(tamanho = 10) {
  let id = "";
  for (let i = 0; i < tamanho; i++) id += ALFABETO_ID[crypto.randomInt(ALFABETO_ID.length)];
  return id;
}

export function novoToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function iguaisSemVazarTempo(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

async function derivar(senha: string, salt: string, tamanho: number) {
  return (await scrypt(senha, salt, tamanho)).toString("hex");
}

/**
 * RN13 — a senha da pessoa gera um par de chaves. Guardamos só:
 * - a chave pública (para o sorteio cifrar o amigo secreto para ela);
 * - a chave privada CIFRADA com uma chave derivada da senha (só ela abre).
 */
export async function criarCredenciais(senha: string) {
  const saltSenha = crypto.randomBytes(16).toString("hex");
  const saltChave = crypto.randomBytes(16).toString("hex");
  const senhaHash = await derivar(senha, saltSenha, 64);
  const chave = await derivar(senha, saltChave, 32);

  const { publicKey, privateKey } = await gerarParDeChaves("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase: chave,
    },
  });

  return {
    saltSenha,
    saltChave,
    senhaHash,
    chavePublica: publicKey as unknown as string,
    chavePrivadaCifrada: privateKey as unknown as string,
    chave,
  };
}

export async function senhaConfere(p: Participante, senha: string) {
  const hash = await derivar(senha, p.saltSenha, 64);
  return iguaisSemVazarTempo(hash, p.senhaHash);
}

export function derivarChave(p: Participante, senha: string) {
  return derivar(senha, p.saltChave, 32);
}

/** RN14 — cifra o id do amigo secreto com a chave pública do participante. */
export function cifrarPara(chavePublica: string, texto: string) {
  return crypto
    .publicEncrypt(
      { key: chavePublica, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      Buffer.from(texto, "utf8"),
    )
    .toString("base64");
}

/** RN15 — só quem tem a senha (chave derivada) consegue abrir. */
export function decifrarCom(p: Participante, chave: string, cifrado: string) {
  return crypto
    .privateDecrypt(
      {
        key: p.chavePrivadaCifrada,
        passphrase: chave,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(cifrado, "base64"),
    )
    .toString("utf8");
}
