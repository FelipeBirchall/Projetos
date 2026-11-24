import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { ErroNegocio, type Grupo } from "./tipos";

/*
 * Onde os grupos ficam guardados:
 * - Com as variáveis do Upstash Redis (Vercel): cada grupo é um registro no Redis.
 * - Sem elas (seu PC, testes): um arquivo JSON por grupo em data/grupos/.
 *
 * Nos dois casos o grupo continua sendo o mesmo JSON, e toda gravação usa
 * "controle de versão otimista": só grava se ninguém tiver gravado antes;
 * senão relê e tenta de novo. Assim, várias instâncias do servidor rodando ao
 * mesmo tempo (como na Vercel) não perdem cadastros.
 */

export const PASTA_DADOS = process.env.DATA_DIR || path.join(process.cwd(), "data");
const PASTA_GRUPOS = path.join(PASTA_DADOS, "grupos");
const ID_VALIDO = /^[a-z0-9]{10}$/;

/** Dias que um grupo fica guardado depois da data da troca (depois disso o Redis apaga sozinho). */
const DIAS_APOS_TROCA = 90;

export interface Motor {
  nome: string;
  ler(id: string): Promise<Grupo | null>;
  /**
   * Grava somente se a versão guardada ainda for `versaoEsperada`
   * (`null` = grupo novo, só grava se ainda não existir). Devolve false em conflito.
   */
  gravar(grupo: Grupo, versaoEsperada: number | null): Promise<boolean>;
}

function validarId(id: string) {
  // Evita path traversal e chaves estranhas: só aceitamos ids no formato que nós mesmos geramos.
  if (!ID_VALIDO.test(id)) throw new ErroNegocio(404, "Grupo não encontrado.");
}

// ------------------------------------------------------------------ motor: arquivo JSON

const g = globalThis as unknown as { __filasTreno?: Map<string, Promise<unknown>> };
const filas = (g.__filasTreno ??= new Map());

/** Fila por grupo: dentro de um mesmo processo, as gravações acontecem uma de cada vez. */
function naFila<T>(id: string, tarefa: () => Promise<T>): Promise<T> {
  const anterior = filas.get(id) ?? Promise.resolve();
  const atual = anterior.catch(() => undefined).then(tarefa);
  filas.set(id, atual);
  atual
    .finally(() => {
      if (filas.get(id) === atual) filas.delete(id);
    })
    .catch(() => undefined);
  return atual;
}

export const motorArquivo: Motor = {
  nome: "arquivo",
  async ler(id) {
    try {
      return JSON.parse(await fs.readFile(path.join(PASTA_GRUPOS, `${id}.json`), "utf8")) as Grupo;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  },
  async gravar(grupo, versaoEsperada) {
    const atual = await this.ler(grupo.id);
    if (versaoEsperada === null ? atual !== null : (atual?.versao ?? 0) !== versaoEsperada) return false;
    await fs.mkdir(PASTA_GRUPOS, { recursive: true });
    const destino = path.join(PASTA_GRUPOS, `${grupo.id}.json`);
    const temporario = `${destino}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporario, JSON.stringify(grupo, null, 2), "utf8");
    await fs.rename(temporario, destino); // escrita atômica
    return true;
  },
};

// ------------------------------------------------------------------ motor: Upstash Redis

/**
 * Compara a versão e grava numa única operação atômica no Redis.
 * KEYS[1] = chave do grupo; ARGV = json, versão esperada ("novo" para criar), nova versão, expira em (unix).
 */
const SCRIPT_GRAVAR = `
local v = redis.call('HGET', KEYS[1], 'versao')
if ARGV[2] == 'novo' then
  if v then return 0 end
elseif v ~= ARGV[2] then
  return 0
end
redis.call('HSET', KEYS[1], 'dados', ARGV[1], 'versao', ARGV[3])
redis.call('EXPIREAT', KEYS[1], tonumber(ARGV[4]))
return 1
`;

const chave = (id: string) => `treno:grupo:${id}`;

function expiraEm(grupo: Grupo) {
  const troca = Date.parse(`${grupo.dataTroca}T23:59:59Z`);
  const base = Number.isFinite(troca) ? Math.max(troca, Date.now()) : Date.now();
  return Math.floor(base / 1000) + DIAS_APOS_TROCA * 24 * 60 * 60;
}

/** O pedaço do cliente Redis que usamos (facilita testar com um Redis de mentira). */
export type ClienteRedis = Pick<Redis, "hgetall" | "eval">;

export function criarMotorRedis(redis: ClienteRedis): Motor {
  return {
    nome: "redis",
    async ler(id) {
      const r = await redis.hgetall<{ dados: string; versao: string }>(chave(id));
      if (!r || typeof r.dados !== "string") return null;
      return JSON.parse(r.dados) as Grupo;
    },
    async gravar(grupo, versaoEsperada) {
      const ok = await redis.eval(
        SCRIPT_GRAVAR,
        [chave(grupo.id)],
        [
          JSON.stringify(grupo),
          versaoEsperada === null ? "novo" : String(versaoEsperada),
          String(grupo.versao ?? 0),
          String(expiraEm(grupo)),
        ],
      );
      return Number(ok) === 1;
    },
  };
}

export function credenciaisRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

// ------------------------------------------------------------------ escolha do motor

let motorAtual: Motor | null = null;

function motor(): Motor {
  if (motorAtual) return motorAtual;
  const cred = credenciaisRedis();
  if (cred) {
    // automaticDeserialization: false → o Redis devolve o texto exatamente como gravamos.
    motorAtual = criarMotorRedis(new Redis({ ...cred, automaticDeserialization: false }));
  } else if (process.env.VERCEL) {
    // Na Vercel o disco não é persistente: melhor falhar com uma mensagem clara do que perder dados.
    throw new ErroNegocio(
      500,
      "Armazenamento não configurado: conecte um banco Upstash Redis ao projeto na Vercel.",
    );
  } else {
    motorAtual = motorArquivo;
  }
  return motorAtual;
}

/** Só para testes: troca o motor de armazenamento. */
export function definirMotor(m: Motor | null) {
  motorAtual = m;
}

// ------------------------------------------------------------------ API usada pelas regras

export async function lerGrupo(id: string): Promise<Grupo> {
  validarId(id);
  const grupo = await motor().ler(id);
  if (!grupo) throw new ErroNegocio(404, "Grupo não encontrado.");
  return grupo;
}

const TENTATIVAS = 10;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function atualizarComVersao<T>(id: string, alterar: (grupo: Grupo) => T | Promise<T>): Promise<T> {
  const m = motor();
  for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
    const grupo = await m.ler(id);
    if (!grupo) throw new ErroNegocio(404, "Grupo não encontrado.");
    const versao = grupo.versao ?? 0;
    const resultado = await alterar(grupo); // se lançar erro, nada é gravado
    grupo.versao = versao + 1;
    if (await m.gravar(grupo, versao)) return resultado;
    // Outra pessoa gravou antes: espera um pouquinho e refaz em cima da versão nova.
    await esperar(15 + Math.random() * 40 * (tentativa + 1));
  }
  throw new ErroNegocio(503, "Muita gente mexendo no grupo ao mesmo tempo. Tente de novo em instantes.");
}

/** Lê, aplica a alteração e grava, sem perder alterações feitas ao mesmo tempo por outra pessoa. */
export function atualizarGrupo<T>(id: string, alterar: (grupo: Grupo) => T | Promise<T>): Promise<T> {
  validarId(id);
  // No arquivo local também passamos pela fila, para evitar retrabalho dentro do mesmo processo.
  return motor() === motorArquivo
    ? naFila(id, () => atualizarComVersao(id, alterar))
    : atualizarComVersao(id, alterar);
}

export async function criarGrupo(grupo: Grupo) {
  validarId(grupo.id);
  grupo.versao = 1;
  if (!(await motor().gravar(grupo, null))) {
    throw new ErroNegocio(409, "Não foi possível criar o grupo. Tente de novo.");
  }
}
