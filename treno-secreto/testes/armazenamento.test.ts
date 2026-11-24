import { existsSync, promises as fs } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  atualizarGrupo,
  definirMotor,
  lerGrupo,
  type Motor,
  motorArquivo,
  PASTA_DADOS,
} from "@/lib/armazenamento";
import { cadastrar, criarNovoGrupo, entrar, obterInfoPublica, painelAdmin, revelarAmigo, sortear } from "@/lib/regras";
import type { Sessao } from "@/lib/sessao";
import { ErroNegocio } from "@/lib/tipos";
import { criarUpstashFalso } from "./upstash-falso";

async function esperaErro(promessa: Promise<unknown>, status: number) {
  const erro = await promessa.then(
    () => null,
    (e) => e,
  );
  expect(erro).toBeInstanceOf(ErroNegocio);
  expect(erro.status).toBe(status);
  return erro as ErroNegocio;
}

const novoGrupo = (nome: string) =>
  criarNovoGrupo({ nome, dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" });

/** Liga o "modo Vercel": variáveis do Upstash + servidor Upstash simulado. */
function ligarUpstash(opcoes?: { atrasoMaxMs?: number }) {
  const upstash = criarUpstashFalso(opcoes);
  vi.stubEnv("KV_REST_API_URL", "https://exemplo-falso.upstash.io");
  vi.stubEnv("KV_REST_API_TOKEN", "token-falso");
  vi.stubGlobal("fetch", upstash.fetch);
  definirMotor(null); // força o site a escolher o motor de novo, exatamente como em produção
  return upstash;
}

afterEach(() => {
  definirMotor(null);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("modo Vercel: cliente Upstash real + servidor simulado + script Lua de verdade", () => {
  let upstash: ReturnType<typeof criarUpstashFalso>;

  beforeEach(() => {
    upstash = ligarUpstash();
  });

  it("regressão: o grupo recém-criado é encontrado ao abrir o link (bug do 'Grupo não encontrado')", async () => {
    const { id } = await novoGrupo("Natal Vercel");
    const info = await obterInfoPublica(id);
    expect(info.nome).toBe("Natal Vercel");
    expect(upstash.stats.comandos).toContain("hget");
  });

  it("guarda no Redis (não em arquivo) e expira 90 dias após a troca", async () => {
    const { id } = await novoGrupo("Natal Redis");
    expect(upstash.banco.has(`treno:grupo:${id}`)).toBe(true);
    expect(existsSync(path.join(PASTA_DADOS, "grupos", `${id}.json`))).toBe(false);
    const esperado = Math.floor(Date.parse("2099-12-24T23:59:59Z") / 1000) + 90 * 86400;
    expect(upstash.expiraEm.get(`treno:grupo:${id}`)).toBe(esperado);
  });

  it("fluxo completo: cadastro, login, sorteio, revelação simultânea e sigilo", async () => {
    const { id, adminToken } = await novoGrupo("Fluxo");
    const sessoes: Sessao[] = [];
    for (const nome of ["Ana", "Bruno", "Carla", "Diego"]) {
      const r = await cadastrar(id, nome, `s-${nome}`);
      sessoes.push({ grupoId: id, participanteId: r.participanteId, chave: r.chave });
    }
    await expect(entrar(id, "Ana", "s-Ana")).resolves.toHaveProperty("participanteId");
    await sortear(id, adminToken);
    const tirados = await Promise.all(sessoes.map((s) => revelarAmigo(id, s)));
    expect(new Set(tirados.map((t) => t.nome)).size).toBe(4);
    const painel = await painelAdmin(id, adminToken);
    expect(painel.participantes.every((p) => p.visualizou)).toBe(true); // nenhuma marcação se perdeu
    const bruto = upstash.banco.get(`treno:grupo:${id}`)!.get("dados")!;
    expect(bruto).not.toContain(adminToken);
    expect(bruto).not.toMatch(/"(amigoId|tirou|pares)"/);
  });

  it("cadastros simultâneos não se perdem", async () => {
    const { id } = await novoGrupo("Concorrência");
    const nomes = Array.from({ length: 10 }, (_, i) => `Pessoa ${i + 1}`);
    await Promise.all(nomes.map((n) => cadastrar(id, n, "senha123")));
    const g = await lerGrupo(id);
    expect(g.participantes.map((p) => p.nome).sort()).toEqual([...nomes].sort());
    expect(g.versao).toBe(1 + nomes.length);
  });

  it("25 alterações ao mesmo tempo: o script Lua recusa conflitos e nada se perde", async () => {
    const { id } = await novoGrupo("Disputa");
    const marcas = Array.from({ length: 25 }, (_, i) => `m${i}`);
    await Promise.all(
      marcas.map((m) =>
        atualizarGrupo(id, (g) => {
          g.exclusoes.push([m, m]);
        }),
      ),
    );
    const g = await lerGrupo(id);
    expect(g.exclusoes.map(([m]) => m).sort()).toEqual([...marcas].sort());
    expect(g.versao).toBe(26);
    expect(upstash.stats.conflitos).toBeGreaterThan(0); // o caminho de conflito foi exercitado de verdade
  }, 30_000);

  it("erro de regra de negócio não grava nada", async () => {
    const { id } = await novoGrupo("Sem gravação");
    const antes = upstash.stats.gravacoes;
    await esperaErro(cadastrar(id, "A", "1234"), 400);
    expect(upstash.stats.gravacoes).toBe(antes);
  });

  it("o script não deixa criar um grupo por cima de outro com o mesmo id", async () => {
    const { id } = await novoGrupo("Original");
    const g = await lerGrupo(id);
    await esperaErro(
      (async () => {
        const { criarGrupo } = await import("@/lib/armazenamento");
        await criarGrupo({ ...g, nome: "Impostor" });
      })(),
      409,
    );
    expect((await lerGrupo(id)).nome).toBe("Original");
  });

  it("grupo inexistente continua dando 404", async () => {
    await esperaErro(lerGrupo("zzzzzzzzzz"), 404);
  });
});

describe("controle de versão", () => {
  it("desiste com 503 se os conflitos não param (em vez de travar ou gravar por cima)", async () => {
    ligarUpstash({ atrasoMaxMs: 0 });
    const { id } = await novoGrupo("Teimoso");
    const grupo = await lerGrupo(id);
    // Motor que sempre responde "outra pessoa gravou antes".
    const sempreConflito: Motor = { nome: "conflito", ler: async () => structuredClone(grupo), gravar: async () => false };
    definirMotor(sempreConflito);
    const erro = await esperaErro(
      atualizarGrupo(id, (g) => {
        g.nome = "nunca";
      }),
      503,
    );
    expect(erro.message).toContain("Tente de novo");
  }, 20_000);

  it("arquivos antigos, sem o campo de versão, continuam funcionando", async () => {
    definirMotor(motorArquivo);
    const { id } = await novoGrupo("Antigo");
    const arquivo = path.join(PASTA_DADOS, "grupos", `${id}.json`);
    const bruto = JSON.parse(await fs.readFile(arquivo, "utf8"));
    delete bruto.versao; // como os grupos criados antes desta mudança
    await fs.writeFile(arquivo, JSON.stringify(bruto));
    await cadastrar(id, "Zé", "1234");
    const g = await lerGrupo(id);
    expect(g.participantes).toHaveLength(1);
    expect(g.versao).toBe(1);
  });
});

describe("configuração na Vercel", () => {
  it("sem Upstash configurado, na Vercel, falha com mensagem clara (não grava em disco temporário)", async () => {
    definirMotor(null);
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const erro = await esperaErro(lerGrupo("abcdefghij"), 500);
    expect(erro.message).toContain("Upstash");
  });

  it("com Upstash, o segredo da sessão vem do token e nenhum arquivo é criado", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("KV_REST_API_URL", "https://exemplo.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "token-de-teste");
    vi.resetModules(); // recarrega sessao.ts para não usar segredo em cache
    const { NextRequest, NextResponse } = await import("next/server");
    const sessao = await import("@/lib/sessao");
    const res = NextResponse.json({});
    const req = new NextRequest("https://treno.vercel.app/api");
    sessao.iniciarSessao(req, res, { grupoId: "abcdefghij", participanteId: "p1", chave: "k" });
    const cookie = res.cookies.get("treno_abcdefghij")!.value;
    const req2 = new NextRequest("https://treno.vercel.app/api", { headers: { cookie: `treno_abcdefghij=${cookie}` } });
    expect(sessao.lerSessao(req2, "abcdefghij")).toEqual({ grupoId: "abcdefghij", participanteId: "p1", chave: "k" });
    expect(existsSync(path.join(PASTA_DADOS, ".segredo-sessao"))).toBe(false);
  });
});
