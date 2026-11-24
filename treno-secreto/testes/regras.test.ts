import { promises as fs } from "fs";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { atualizarGrupo, lerGrupo, PASTA_DADOS } from "@/lib/armazenamento";
import {
  adicionarExclusao,
  cadastrar,
  criarNovoGrupo,
  entrar,
  meusDados,
  obterInfoPublica,
  painelAdmin,
  reabrir,
  removerExclusao,
  removerParticipante,
  revelarAmigo,
  salvarLista,
  sortear,
} from "@/lib/regras";
import type { Sessao } from "@/lib/sessao";
import { ErroNegocio } from "@/lib/tipos";

const DATA_FUTURA = "2099-12-24";

function ontem() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
}

async function novoGrupo(extra: Partial<{ prazoCadastro: string; dataTroca: string }> = {}) {
  return criarNovoGrupo({
    nome: "Grupo de Teste",
    dataTroca: extra.dataTroca ?? DATA_FUTURA,
    valorMinimo: 30, valorMaximo: 50,
    prazoCadastro: extra.prazoCadastro ?? "",
  });
}

/** Cadastra várias pessoas e devolve as sessões (como se cada uma tivesse logado). */
async function cadastrarVarios(grupoId: string, nomes: string[]) {
  const sessoes: Record<string, Sessao> = {};
  await Promise.all(
    nomes.map(async (nome) => {
      const r = await cadastrar(grupoId, nome, `senha-${nome}`);
      sessoes[nome] = { grupoId, participanteId: r.participanteId, chave: r.chave };
    }),
  );
  return sessoes;
}

async function idsPorNome(grupoId: string) {
  const g = await lerGrupo(grupoId);
  return Object.fromEntries(g.participantes.map((p) => [p.nome, p.id]));
}

/** Espera um ErroNegocio com o status HTTP indicado. */
async function esperaErro(promessa: Promise<unknown>, status: number, trecho?: string) {
  const erro = await promessa.then(
    () => null,
    (e) => e,
  );
  expect(erro, "deveria ter dado erro").toBeInstanceOf(ErroNegocio);
  expect(erro.status).toBe(status);
  if (trecho) expect(erro.message).toContain(trecho);
}

// --------------------------------------------------------------------------------------------

describe("criação do grupo (RN01, RN03)", () => {
  it("cria o grupo e guarda só o hash do token do organizador", async () => {
    const { id, adminToken } = await novoGrupo();
    const bruto = await fs.readFile(path.join(PASTA_DADOS, "grupos", `${id}.json`), "utf8");
    expect(bruto).not.toContain(adminToken);
    const g = JSON.parse(bruto);
    expect(g.status).toBe("aberto");
    expect(g.adminTokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("valida nome, data e prazo", async () => {
    await esperaErro(criarNovoGrupo({ nome: "A", dataTroca: DATA_FUTURA, valorMinimo: "", valorMaximo: "", prazoCadastro: "" }), 400);
    await esperaErro(criarNovoGrupo({ nome: "Grupo", dataTroca: "", valorMinimo: "", valorMaximo: "", prazoCadastro: "" }), 400);
    await esperaErro(
      criarNovoGrupo({ nome: "Grupo", dataTroca: "24/12/2099", valorMinimo: "", valorMaximo: "", prazoCadastro: "" }),
      400,
    );
    await esperaErro(
      criarNovoGrupo({ nome: "Grupo", dataTroca: "2099-12-01", valorMinimo: "", valorMaximo: "", prazoCadastro: "2099-12-10" }),
      400,
      "antes da data da troca",
    );
  });

  it("ids inválidos ou maliciosos não acessam arquivos (path traversal)", async () => {
    await esperaErro(obterInfoPublica("../../etc/passwd"), 404);
    await esperaErro(obterInfoPublica("..%2f..%2f"), 404);
    await esperaErro(obterInfoPublica("abc"), 404);
    await esperaErro(obterInfoPublica("zzzzzzzzzz"), 404); // formato válido, mas não existe
  });
});

describe("cadastro (RN04–RN07)", () => {
  it("não aceita nomes repetidos, mesmo com maiúsculas, acentos ou espaços diferentes", async () => {
    const { id } = await novoGrupo();
    await cadastrar(id, "Ana Lúcia", "1234");
    await esperaErro(cadastrar(id, "ana lucia", "1234"), 409, "Já existe");
    await esperaErro(cadastrar(id, "  ANA   LÚCIA ", "1234"), 409);
  });

  it("valida tamanho do nome e da senha", async () => {
    const { id } = await novoGrupo();
    await esperaErro(cadastrar(id, "A", "1234"), 400);
    await esperaErro(cadastrar(id, "x".repeat(41), "1234"), 400);
    await esperaErro(cadastrar(id, "Bruno", "123"), 400);
  });

  it("bloqueia cadastro depois do prazo", async () => {
    const { id } = await novoGrupo({ prazoCadastro: ontem() });
    await esperaErro(cadastrar(id, "Atrasado", "1234"), 409, "prazo");
    expect((await obterInfoPublica(id)).cadastroAberto).toBe(false);
  });

  it("bloqueia cadastro depois do sorteio (RN06)", async () => {
    const { id, adminToken } = await novoGrupo();
    await cadastrarVarios(id, ["Ana", "Bruno", "Carla"]);
    await sortear(id, adminToken);
    await esperaErro(cadastrar(id, "Diego", "1234"), 409, "sorteio");
  });

  it("cadastros simultâneos não se perdem (fila de escrita do JSON)", async () => {
    const { id } = await novoGrupo();
    const nomes = Array.from({ length: 12 }, (_, i) => `Pessoa ${i + 1}`);
    await cadastrarVarios(id, nomes);
    const g = await lerGrupo(id);
    expect(g.participantes.map((p) => p.nome).sort()).toEqual([...nomes].sort());
  });

  it("informações públicas mostram só nomes, em ordem alfabética (RN17)", async () => {
    const { id } = await novoGrupo();
    await cadastrarVarios(id, ["Zeca", "Ana", "Marcos"]);
    const info = await obterInfoPublica(id);
    expect(info.participantes).toEqual([{ nome: "Ana" }, { nome: "Marcos" }, { nome: "Zeca" }]);
    expect(JSON.stringify(info)).not.toMatch(/senha|chave|amigo|adminToken/i);
  });
});

describe("login e bloqueio por tentativas (RN15, RN18)", () => {
  it("entra com nome em qualquer formato e devolve a mesma chave do cadastro", async () => {
    const { id } = await novoGrupo();
    const c = await cadastrar(id, "João", "natal123");
    const l = await entrar(id, "  JOAO ", "natal123");
    expect(l.participanteId).toBe(c.participanteId);
    expect(l.chave).toBe(c.chave);
  });

  it("nome inexistente dá a mesma mensagem genérica", async () => {
    const { id } = await novoGrupo();
    await esperaErro(entrar(id, "Fantasma", "1234"), 401, "Nome ou senha inválidos");
  });

  it("5 senhas erradas bloqueiam por 15 min, até com a senha certa", async () => {
    const { id } = await novoGrupo();
    await cadastrar(id, "Carla", "certa123");
    for (let i = 1; i <= 4; i++) {
      await esperaErro(entrar(id, "Carla", "errada"), 401, `Restam ${5 - i}`);
    }
    await esperaErro(entrar(id, "Carla", "errada"), 429, "bloqueado");
    await esperaErro(entrar(id, "Carla", "certa123"), 429, "Tente de novo");

    // Simula o fim do bloqueio.
    await atualizarGrupo(id, (g) => {
      g.participantes[0].bloqueadoAte = new Date(Date.now() - 1000).toISOString();
    });
    await expect(entrar(id, "Carla", "certa123")).resolves.toHaveProperty("participanteId");
    expect((await lerGrupo(id)).participantes[0].tentativasFalhas).toBe(0);
  });

  it("acerto zera o contador de erros", async () => {
    const { id } = await novoGrupo();
    await cadastrar(id, "Davi", "certa123");
    await esperaErro(entrar(id, "Davi", "x1"), 401);
    await esperaErro(entrar(id, "Davi", "x2"), 401);
    await entrar(id, "Davi", "certa123");
    await esperaErro(entrar(id, "Davi", "x3"), 401, "Restam 4");
  });
});

describe("sorteio completo e revelação (RN08–RN16)", () => {
  const nomes = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio"];
  let grupoId: string;
  let token: string;
  let sessoes: Record<string, Sessao>;
  let ids: Record<string, string>;

  beforeAll(async () => {
    const g = await novoGrupo();
    grupoId = g.id;
    token = g.adminToken;
    sessoes = await cadastrarVarios(grupoId, nomes);
    ids = await idsPorNome(grupoId);
    await adicionarExclusao(grupoId, token, ids.Ana, ids.Bruno);
    await adicionarExclusao(grupoId, token, ids.Carla, ids.Diego);
    await salvarLista(grupoId, sessoes.Elisa, ["Livro", "  ", "Chocolate  "]);
  });

  it("antes do sorteio ninguém consegue revelar", async () => {
    await esperaErro(revelarAmigo(grupoId, sessoes.Ana), 409, "ainda não");
  });

  it("cada um vê só o próprio amigo, e o conjunto forma um ciclo único que respeita os casais", async () => {
    // Repete o sorteio várias vezes para ganhar confiança estatística.
    for (let rodada = 0; rodada < 8; rodada++) {
      await sortear(grupoId, token);
      const tirou: Record<string, string> = {};
      for (const nome of nomes) {
        const r = await revelarAmigo(grupoId, sessoes[nome]);
        expect(Object.keys(r).sort()).toEqual(["listaDesejos", "nome"]); // RN16: só o necessário
        tirou[nome] = r.nome;
      }
      expect(new Set(Object.values(tirou)).size).toBe(nomes.length);
      for (const nome of nomes) expect(tirou[nome]).not.toBe(nome);
      expect(tirou.Ana).not.toBe("Bruno");
      expect(tirou.Bruno).not.toBe("Ana");
      expect(tirou.Carla).not.toBe("Diego");
      expect(tirou.Diego).not.toBe("Carla");
      // ciclo único
      let atual = tirou.Ana;
      let passos = 1;
      while (atual !== "Ana") {
        atual = tirou[atual];
        passos++;
      }
      expect(passos).toBe(nomes.length);
    }
  });

  it("revelar marca 'visualizou', e refazer o sorteio zera de novo", async () => {
    await sortear(grupoId, token);
    await revelarAmigo(grupoId, sessoes.Ana);
    let painel = await painelAdmin(grupoId, token);
    expect(painel.participantes.find((p) => p.nome === "Ana")!.visualizou).toBe(true);
    expect(painel.participantes.find((p) => p.nome === "Bruno")!.visualizou).toBe(false);
    painel = await sortear(grupoId, token);
    expect(painel.participantes.every((p) => !p.visualizou)).toBe(true);
  });

  it("RN20: a lista de desejos aparece só para quem tirou a pessoa, já atualizada", async () => {
    await sortear(grupoId, token);
    let quemTirouElisa: string | null = null;
    for (const nome of nomes) {
      const r = await revelarAmigo(grupoId, sessoes[nome]);
      if (r.nome === "Elisa") {
        quemTirouElisa = nome;
        expect(r.listaDesejos).toEqual(["Livro", "Chocolate"]);
      } else {
        expect(r.listaDesejos).not.toContain("Livro");
      }
    }
    expect(quemTirouElisa).not.toBeNull();
    // Elisa muda a lista depois do sorteio; quem a tirou vê a versão nova.
    await salvarLista(grupoId, sessoes.Elisa, ["Bicicleta"]);
    expect((await revelarAmigo(grupoId, sessoes[quemTirouElisa!])).listaDesejos).toEqual(["Bicicleta"]);
  });

  it("sessão adulterada (chave de outra pessoa) não revela nada", async () => {
    const falsa: Sessao = { grupoId, participanteId: ids.Ana, chave: sessoes.Bruno.chave };
    await esperaErro(revelarAmigo(grupoId, falsa), 401);
    await esperaErro(revelarAmigo(grupoId, null), 401);
    await esperaErro(revelarAmigo(grupoId, { grupoId, participanteId: "naoexiste1", chave: "x" }), 401);
  });

  it("RN12 / RN14: o arquivo JSON não revela quem tirou quem", async () => {
    await sortear(grupoId, token);
    const bruto = await fs.readFile(path.join(PASTA_DADOS, "grupos", `${grupoId}.json`), "utf8");
    const g = JSON.parse(bruto);
    for (const p of g.participantes) {
      expect(p.amigoCifrado).toBeTruthy();
      // Nenhum id de outro participante aparece dentro do registro desta pessoa.
      const registro = JSON.stringify(p);
      for (const outro of g.participantes) {
        if (outro.id !== p.id) expect(registro).not.toContain(outro.id);
      }
      // Nenhum nome em claro no resultado cifrado.
      for (const nome of nomes) expect(p.amigoCifrado).not.toContain(nome);
    }
    // A ordem no arquivo não é a ordem do ciclo: verificamos que não há campo de "ordem" nem mapa de pares.
    expect(bruto).not.toMatch(/"(ordem|pares|resultado|amigoId|tirou)"/);
  });

  it("RN02 / RN21: o painel do organizador não tem nada que ligue as pessoas", async () => {
    const painel = await painelAdmin(grupoId, token);
    const texto = JSON.stringify(painel);
    expect(texto).not.toMatch(/amigoCifrado|chave|senha|salt/i);
    for (const p of painel.participantes) {
      expect(Object.keys(p).sort()).toEqual(["criadoEm", "id", "nome", "visualizou"]);
    }
  });

  it("meusDados não traz o amigo, só os dados da própria pessoa", async () => {
    const d = await meusDados(grupoId, sessoes.Carla);
    expect(d.eu.nome).toBe("Carla");
    expect(JSON.stringify(d)).not.toMatch(/amigo/i);
  });
});

describe("organizador (RN02, RN06, RN10, RN19)", () => {
  it("token errado ou ausente é recusado em todas as ações", async () => {
    const { id } = await novoGrupo();
    await cadastrarVarios(id, ["Ana", "Bruno", "Carla"]);
    const ids = await idsPorNome(id);
    for (const t of [null, "", "token-falso", "x".repeat(43)]) {
      await esperaErro(painelAdmin(id, t), 403);
      await esperaErro(sortear(id, t), 403);
      await esperaErro(reabrir(id, t), 403);
      await esperaErro(adicionarExclusao(id, t, ids.Ana, ids.Bruno), 403);
      await esperaErro(removerExclusao(id, t, ids.Ana, ids.Bruno), 403);
      await esperaErro(removerParticipante(id, t, ids.Ana), 403);
    }
    expect((await lerGrupo(id)).status).toBe("aberto");
  });

  it("o token de um grupo não serve em outro grupo", async () => {
    const a = await novoGrupo();
    const b = await novoGrupo();
    await esperaErro(painelAdmin(b.id, a.adminToken), 403);
  });

  it("RN07: precisa de pelo menos 3 participantes", async () => {
    const { id, adminToken } = await novoGrupo();
    await cadastrarVarios(id, ["Ana", "Bruno"]);
    await esperaErro(sortear(id, adminToken), 409, "pelo menos 3");
  });

  it("regras dos casais: pessoa diferente, sem duplicar, só participantes", async () => {
    const { id, adminToken } = await novoGrupo();
    await cadastrarVarios(id, ["Ana", "Bruno", "Carla", "Diego"]);
    const ids = await idsPorNome(id);
    await esperaErro(adicionarExclusao(id, adminToken, ids.Ana, ids.Ana), 400);
    await esperaErro(adicionarExclusao(id, adminToken, ids.Ana, "naoexiste1"), 400);
    await adicionarExclusao(id, adminToken, ids.Ana, ids.Bruno);
    await esperaErro(adicionarExclusao(id, adminToken, ids.Bruno, ids.Ana), 409, "já está");
    const painel = await removerExclusao(id, adminToken, ids.Bruno, ids.Ana); // ordem invertida também remove
    expect(painel.exclusoes).toEqual([]);
  });

  it("casais impossíveis geram erro claro e o grupo continua aberto", async () => {
    const { id, adminToken } = await novoGrupo();
    await cadastrarVarios(id, ["Ana", "Bruno", "Carla"]);
    const ids = await idsPorNome(id);
    await adicionarExclusao(id, adminToken, ids.Ana, ids.Bruno);
    await esperaErro(sortear(id, adminToken), 409, "Não existe sorteio possível");
    const g = await lerGrupo(id);
    expect(g.status).toBe("aberto");
    expect(g.participantes.every((p) => p.amigoCifrado === null)).toBe(true);
  });

  it("depois do sorteio não dá para remover pessoas nem mudar casais (RN06)", async () => {
    const { id, adminToken } = await novoGrupo();
    await cadastrarVarios(id, ["Ana", "Bruno", "Carla", "Diego"]);
    const ids = await idsPorNome(id);
    await sortear(id, adminToken);
    await esperaErro(removerParticipante(id, adminToken, ids.Ana), 409, "reabra");
    await esperaErro(adicionarExclusao(id, adminToken, ids.Ana, ids.Bruno), 409, "reabra");
  });

  it("remover participante também remove os casais dele", async () => {
    const { id, adminToken } = await novoGrupo();
    await cadastrarVarios(id, ["Ana", "Bruno", "Carla", "Diego"]);
    const ids = await idsPorNome(id);
    await adicionarExclusao(id, adminToken, ids.Ana, ids.Bruno);
    await adicionarExclusao(id, adminToken, ids.Carla, ids.Diego);
    const painel = await removerParticipante(id, adminToken, ids.Ana);
    expect(painel.participantes.map((p) => p.nome)).toEqual(["Bruno", "Carla", "Diego"]);
    expect(painel.exclusoes).toEqual([[ids.Carla, ids.Diego]]);
  });

  it("RN19: fluxo de senha esquecida (reabrir → remover → recadastrar → sortear)", async () => {
    const { id, adminToken } = await novoGrupo();
    const sessoes = await cadastrarVarios(id, ["Ana", "Bruno", "Carla", "Diego"]);
    const ids = await idsPorNome(id);
    await sortear(id, adminToken);

    // Bruno esqueceu a senha.
    await esperaErro(entrar(id, "Bruno", "chute"), 401);
    const painelReaberto = await reabrir(id, adminToken);
    expect(painelReaberto.grupo.status).toBe("aberto");
    expect((await lerGrupo(id)).participantes.every((p) => p.amigoCifrado === null)).toBe(true);
    await esperaErro(revelarAmigo(id, sessoes.Ana), 409);

    await removerParticipante(id, adminToken, ids.Bruno);
    const novo = await cadastrar(id, "Bruno", "nova-senha");
    await sortear(id, adminToken);

    const brunoNovo: Sessao = { grupoId: id, participanteId: novo.participanteId, chave: novo.chave };
    const r = await revelarAmigo(id, brunoNovo);
    expect(["Ana", "Carla", "Diego"]).toContain(r.nome);
    // Os demais continuam com as senhas antigas.
    await expect(revelarAmigo(id, sessoes.Ana)).resolves.toHaveProperty("nome");
  });

  it("reabrir com prazo vencido libera novos cadastros", async () => {
    const { id, adminToken } = await novoGrupo();
    await cadastrarVarios(id, ["Ana", "Bruno", "Carla"]);
    await atualizarGrupo(id, (g) => {
      g.prazoCadastro = ontem();
    });
    await esperaErro(cadastrar(id, "Diego", "1234"), 409, "prazo");
    await sortear(id, adminToken);
    await reabrir(id, adminToken);
    await expect(cadastrar(id, "Diego", "1234")).resolves.toHaveProperty("participanteId");
  });
});

describe("lista de desejos", () => {
  it("valida tamanho, quantidade, tipo e limpa itens vazios", async () => {
    const { id } = await novoGrupo();
    const s = await cadastrarVarios(id, ["Ana"]);
    await esperaErro(salvarLista(id, s.Ana, "não é lista"), 400);
    await esperaErro(salvarLista(id, s.Ana, Array.from({ length: 16 }, (_, i) => `item ${i}`)), 400, "15");
    await esperaErro(salvarLista(id, s.Ana, ["x".repeat(201)]), 400, "200");
    const r = await salvarLista(id, s.Ana, ["  Meia  ", "", 42, "Livro"]);
    expect(r.listaDesejos).toEqual(["Meia", "Livro"]);
  });

  it("sem sessão não salva", async () => {
    const { id } = await novoGrupo();
    await esperaErro(salvarLista(id, null, ["x"]), 401);
  });
});
