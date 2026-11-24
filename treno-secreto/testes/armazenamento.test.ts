import { existsSync, promises as fs } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  atualizarGrupo,
  type ClienteRedis,
  criarMotorRedis,
  definirMotor,
  lerGrupo,
  type Motor,
  motorArquivo,
  PASTA_DADOS,
} from "@/lib/armazenamento";
import { cadastrar, criarNovoGrupo, painelAdmin, revelarAmigo, sortear } from "@/lib/regras";
import type { Sessao } from "@/lib/sessao";
import { ErroNegocio } from "@/lib/tipos";

const pausa = () => new Promise((r) => setTimeout(r, Math.random() * 8));

/**
 * Redis de mentira que imita o script de gravação (compara a versão e grava),
 * com atrasos aleatórios para forçar o entrelaçamento de gravações simultâneas,
 * como várias instâncias da Vercel atendendo ao mesmo tempo.
 */
function redisFalso() {
  const dados = new Map<string, { dados: string; versao: string }>();
  const expiracao = new Map<string, number>();
  const stats = { gravacoes: 0, conflitos: 0 };
  const cliente = {
    async hgetall(chave: string) {
      await pausa();
      const r = dados.get(chave);
      return r ? { ...r } : null;
    },
    async eval(_script: string, chaves: string[], args: string[]) {
      await pausa();
      const [json, esperada, nova, expira] = args;
      const atual = dados.get(chaves[0]);
      const ok = esperada === "novo" ? !atual : atual?.versao === esperada;
      if (!ok) {
        stats.conflitos++;
        return 0;
      }
      dados.set(chaves[0], { dados: json, versao: nova });
      expiracao.set(chaves[0], Number(expira));
      stats.gravacoes++;
      return 1;
    },
  } as unknown as ClienteRedis;
  return { cliente, dados, expiracao, stats };
}

async function esperaErro(promessa: Promise<unknown>, status: number) {
  const erro = await promessa.then(
    () => null,
    (e) => e,
  );
  expect(erro).toBeInstanceOf(ErroNegocio);
  expect(erro.status).toBe(status);
  return erro as ErroNegocio;
}

afterEach(() => {
  definirMotor(null);
  vi.unstubAllEnvs();
});

describe("armazenamento no Redis (Vercel)", () => {
  let redis: ReturnType<typeof redisFalso>;

  beforeEach(() => {
    redis = redisFalso();
    definirMotor(criarMotorRedis(redis.cliente));
  });

  it("guarda o grupo no Redis, não em arquivo, e define a expiração 90 dias após a troca", async () => {
    const { id } = await criarNovoGrupo({ nome: "Natal Redis", dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" });
    expect(redis.dados.has(`treno:grupo:${id}`)).toBe(true);
    expect(existsSync(path.join(PASTA_DADOS, "grupos", `${id}.json`))).toBe(false);
    const esperado = Date.parse("2099-12-24T23:59:59Z") / 1000 + 90 * 86400;
    expect(redis.expiracao.get(`treno:grupo:${id}`)).toBe(Math.floor(esperado));
    expect((await lerGrupo(id)).nome).toBe("Natal Redis");
  });

  it("cadastros simultâneos em 'servidores diferentes' não se perdem", async () => {
    const { id } = await criarNovoGrupo({ nome: "Concorrência", dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" });
    const nomes = Array.from({ length: 10 }, (_, i) => `Pessoa ${i + 1}`);
    await Promise.all(nomes.map((n) => cadastrar(id, n, "senha123")));
    const g = await lerGrupo(id);
    expect(g.participantes.map((p) => p.nome).sort()).toEqual([...nomes].sort());
    expect(g.versao).toBe(1 + nomes.length);
  });

  it("25 alterações disparadas ao mesmo tempo: há conflitos, e todos são resolvidos sem perder nada", async () => {
    const { id } = await criarNovoGrupo({ nome: "Disputa", dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" });
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
    expect(redis.stats.conflitos).toBeGreaterThan(0); // o caminho de conflito foi exercitado de verdade
  }, 30_000);

  it("fluxo completo funciona sobre o Redis: sorteio, revelação e sigilo", async () => {
    const { id, adminToken } = await criarNovoGrupo({ nome: "Fluxo", dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" });
    const sessoes: Sessao[] = [];
    for (const nome of ["Ana", "Bruno", "Carla", "Diego"]) {
      const r = await cadastrar(id, nome, `s-${nome}`);
      sessoes.push({ grupoId: id, participanteId: r.participanteId, chave: r.chave });
    }
    await sortear(id, adminToken);
    const tirados = await Promise.all(sessoes.map((s) => revelarAmigo(id, s))); // revelações simultâneas
    expect(new Set(tirados.map((t) => t.nome)).size).toBe(4);
    const painel = await painelAdmin(id, adminToken);
    expect(painel.participantes.every((p) => p.visualizou)).toBe(true); // nenhuma marcação se perdeu
    const bruto = redis.dados.get(`treno:grupo:${id}`)!.dados;
    expect(bruto).not.toContain(adminToken);
    expect(bruto).not.toMatch(/"(amigoId|tirou|pares)"/);
  });

  it("erro de regra de negócio não grava nada", async () => {
    const { id } = await criarNovoGrupo({ nome: "Sem gravação", dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" });
    const antes = redis.stats.gravacoes;
    await esperaErro(cadastrar(id, "A", "1234"), 400);
    expect(redis.stats.gravacoes).toBe(antes);
  });

  it("não sobrescreve um grupo que já existe com o mesmo id", async () => {
    const m = criarMotorRedis(redis.cliente);
    const { id } = await criarNovoGrupo({ nome: "Original", dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" });
    const g = await lerGrupo(id);
    expect(await m.gravar({ ...g, nome: "Impostor" }, null)).toBe(false);
    expect((await lerGrupo(id)).nome).toBe("Original");
  });
});

describe("controle de versão", () => {
  it("desiste com 503 se os conflitos não param (em vez de travar ou gravar por cima)", async () => {
    const redis = redisFalso();
    const base = criarMotorRedis(redis.cliente);
    definirMotor(base);
    const { id } = await criarNovoGrupo({ nome: "Teimoso", dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" });
    const sempreConflito: Motor = { nome: "conflito", ler: (i) => base.ler(i), gravar: async () => false };
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
    const { id } = await criarNovoGrupo({ nome: "Antigo", dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" });
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
