import { promises as fs } from "fs";
import path from "path";
import { ErroNegocio, type Grupo } from "./tipos";

export const PASTA_DADOS = process.env.DATA_DIR || path.join(process.cwd(), "data");
const PASTA_GRUPOS = path.join(PASTA_DADOS, "grupos");

const ID_VALIDO = /^[a-z0-9]{10}$/;

function arquivoDoGrupo(id: string) {
  // Evita path traversal: só aceitamos ids no formato que nós mesmos geramos.
  if (!ID_VALIDO.test(id)) throw new ErroNegocio(404, "Grupo não encontrado.");
  return path.join(PASTA_GRUPOS, `${id}.json`);
}

// Fila por grupo para que duas requisições simultâneas não sobrescrevam o JSON uma da outra.
const g = globalThis as unknown as { __filasTreno?: Map<string, Promise<unknown>> };
const filas = (g.__filasTreno ??= new Map());

function naFila<T>(id: string, tarefa: () => Promise<T>): Promise<T> {
  const anterior = filas.get(id) ?? Promise.resolve();
  const atual = anterior.catch(() => undefined).then(tarefa);
  filas.set(id, atual);
  atual.finally(() => {
    if (filas.get(id) === atual) filas.delete(id);
  }).catch(() => undefined);
  return atual;
}

async function ler(id: string): Promise<Grupo> {
  try {
    const conteudo = await fs.readFile(arquivoDoGrupo(id), "utf8");
    return JSON.parse(conteudo) as Grupo;
  } catch (e) {
    if (e instanceof ErroNegocio) throw e;
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ErroNegocio(404, "Grupo não encontrado.");
    }
    throw e;
  }
}

async function gravar(grupo: Grupo) {
  await fs.mkdir(PASTA_GRUPOS, { recursive: true });
  const destino = arquivoDoGrupo(grupo.id);
  const temporario = `${destino}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporario, JSON.stringify(grupo, null, 2), "utf8");
  await fs.rename(temporario, destino); // escrita atômica
}

export function lerGrupo(id: string) {
  return naFila(id, () => ler(id));
}

/** Lê, aplica a alteração e grava — tudo dentro da fila do grupo. */
export function atualizarGrupo<T>(id: string, alterar: (grupo: Grupo) => T | Promise<T>) {
  return naFila(id, async () => {
    const grupo = await ler(id);
    const resultado = await alterar(grupo);
    await gravar(grupo);
    return resultado;
  });
}

export function criarGrupo(grupo: Grupo) {
  return naFila(grupo.id, () => gravar(grupo));
}
