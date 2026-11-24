import { atualizarGrupo, criarGrupo, lerGrupo } from "./armazenamento";
import {
  cifrarPara,
  criarCredenciais,
  decifrarCom,
  derivarChave,
  hashToken,
  iguaisSemVazarTempo,
  novoId,
  novoToken,
  senhaConfere,
} from "./cripto";
import type { Sessao } from "./sessao";
import { sortearCiclo } from "./sorteio";
import { ErroNegocio, type Grupo, type Participante } from "./tipos";

export const MIN_PARTICIPANTES = 3;
export const MAX_PARTICIPANTES = 100;
export const MAX_TENTATIVAS = 5;
export const BLOQUEIO_MINUTOS = 15;
export const MAX_ITENS_LISTA = 15;
export const MAX_TAMANHO_ITEM = 200;

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export function normalizarNome(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hoje() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD no fuso do servidor
}

function prazoEncerrado(g: Grupo) {
  return !!g.prazoCadastro && hoje() > g.prazoCadastro;
}

const porNome = (a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome, "pt-BR");

// ---------------------------------------------------------------- grupo

export const VALOR_MAXIMO_PERMITIDO = 100_000; // R$ 100 mil: trava contra digitação errada

/**
 * Converte o valor digitado em centavos. Aceita número ou texto como "50", "50,90",
 * "R$ 1.000,00". Vazio = sem limite (null).
 */
export function paraCentavos(valor: unknown, rotulo: string): number | null {
  if (valor === null || valor === undefined) return null;
  let n: number;
  if (typeof valor === "number") {
    n = valor;
  } else if (typeof valor === "string") {
    let t = valor.replace(/R\$/i, "").replace(/\s/g, "");
    if (!t) return null;
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", "."); // "1.000,50" → "1000.50"
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); // "1.000" → mil reais
    n = /^-?\d+(\.\d{1,2})?$/.test(t) ? Number(t) : NaN;
  } else {
    n = NaN;
  }
  if (!Number.isFinite(n)) throw new ErroNegocio(400, `${rotulo} inválido. Use só números, como 50 ou 49,90.`);
  if (n < 0) throw new ErroNegocio(400, `${rotulo} não pode ser negativo.`);
  if (n > VALOR_MAXIMO_PERMITIDO) throw new ErroNegocio(400, `${rotulo} está alto demais.`);
  return Math.round(n * 100);
}

export async function criarNovoGrupo(dados: {
  nome: string;
  dataTroca: string;
  valorMinimo: unknown;
  valorMaximo: unknown;
  prazoCadastro: string;
}) {
  if (dados.nome.length < 2 || dados.nome.length > 60) {
    throw new ErroNegocio(400, "O nome do grupo deve ter entre 2 e 60 caracteres.");
  }
  if (!DATA.test(dados.dataTroca)) throw new ErroNegocio(400, "Informe a data da troca de presentes.");
  if (dados.prazoCadastro && !DATA.test(dados.prazoCadastro)) {
    throw new ErroNegocio(400, "Data limite de cadastro inválida.");
  }
  if (dados.prazoCadastro && dados.prazoCadastro > dados.dataTroca) {
    throw new ErroNegocio(400, "O prazo de cadastro precisa ser antes da data da troca.");
  }
  const valorMinimo = paraCentavos(dados.valorMinimo, "Valor mínimo");
  const valorMaximo = paraCentavos(dados.valorMaximo, "Valor máximo");
  if (valorMinimo !== null && valorMaximo !== null && valorMinimo > valorMaximo) {
    throw new ErroNegocio(400, "O valor mínimo não pode ser maior que o valor máximo.");
  }

  const adminToken = novoToken();
  const grupo: Grupo = {
    id: novoId(),
    nome: dados.nome,
    dataTroca: dados.dataTroca,
    valorMinimo,
    valorMaximo,
    prazoCadastro: dados.prazoCadastro || null,
    criadoEm: new Date().toISOString(),
    adminTokenHash: hashToken(adminToken), // RN03 — só guardamos o hash do link do organizador
    status: "aberto",
    sorteadoEm: null,
    participantes: [],
    exclusoes: [],
  };
  await criarGrupo(grupo);
  return { id: grupo.id, adminToken };
}

/** Só informações públicas. Nomes em ordem alfabética (RN17). */
export function infoPublica(g: Grupo) {
  return {
    id: g.id,
    nome: g.nome,
    dataTroca: g.dataTroca,
    valorMinimo: g.valorMinimo ?? null,
    valorMaximo: g.valorMaximo ?? null,
    valorSugerido: g.valorSugerido ?? "", // grupos antigos
    prazoCadastro: g.prazoCadastro,
    status: g.status,
    cadastroAberto: g.status === "aberto" && !prazoEncerrado(g),
    participantes: g.participantes.map((p) => ({ nome: p.nome })).sort(porNome),
  };
}

export async function obterInfoPublica(id: string) {
  return infoPublica(await lerGrupo(id));
}

// ---------------------------------------------------------------- participante

function validarSenha(senha: string) {
  if (senha.length < 4 || senha.length > 100) {
    throw new ErroNegocio(400, "A senha precisa ter pelo menos 4 caracteres.");
  }
}

/** RN04–RN07 — cadastro feito pela própria pessoa, com senha que só ela conhece. */
export async function cadastrar(grupoId: string, nome: string, senha: string) {
  nome = nome.replace(/\s+/g, " ");
  if (nome.length < 2 || nome.length > 40) {
    throw new ErroNegocio(400, "O nome deve ter entre 2 e 40 caracteres.");
  }
  validarSenha(senha);

  // As chaves são geradas fora da fila (é a parte lenta).
  const credenciais = await criarCredenciais(senha);

  return atualizarGrupo(grupoId, (g) => {
    if (g.status !== "aberto") throw new ErroNegocio(409, "O sorteio já foi feito. Fale com o organizador.");
    if (prazoEncerrado(g)) throw new ErroNegocio(409, "O prazo de cadastro terminou.");
    if (g.participantes.length >= MAX_PARTICIPANTES) throw new ErroNegocio(409, "O grupo está cheio.");
    const chaveNome = normalizarNome(nome);
    if (g.participantes.some((p) => normalizarNome(p.nome) === chaveNome)) {
      throw new ErroNegocio(409, "Já existe alguém com esse nome no grupo. Use um sobrenome ou apelido.");
    }
    const participante: Participante = {
      id: novoId(),
      nome,
      criadoEm: new Date().toISOString(),
      senhaHash: credenciais.senhaHash,
      saltSenha: credenciais.saltSenha,
      saltChave: credenciais.saltChave,
      chavePublica: credenciais.chavePublica,
      chavePrivadaCifrada: credenciais.chavePrivadaCifrada,
      amigoCifrado: null,
      visualizou: false,
      listaDesejos: [],
      tentativasFalhas: 0,
      bloqueadoAte: null,
    };
    g.participantes.push(participante);
    return { participanteId: participante.id, chave: credenciais.chave };
  });
}

/** RN15 / RN18 — login com limite de tentativas. */
export async function entrar(grupoId: string, nome: string, senha: string) {
  const resultado = await atualizarGrupo(grupoId, async (g) => {
    const p = g.participantes.find((x) => normalizarNome(x.nome) === normalizarNome(nome));
    if (!p) return { erro: new ErroNegocio(401, "Nome ou senha inválidos.") };

    if (p.bloqueadoAte && new Date(p.bloqueadoAte).getTime() > Date.now()) {
      const minutos = Math.ceil((new Date(p.bloqueadoAte).getTime() - Date.now()) / 60000);
      return { erro: new ErroNegocio(429, `Muitas tentativas erradas. Tente de novo em ${minutos} min.`) };
    }

    if (!(await senhaConfere(p, senha))) {
      p.tentativasFalhas += 1;
      if (p.tentativasFalhas >= MAX_TENTATIVAS) {
        p.tentativasFalhas = 0;
        p.bloqueadoAte = new Date(Date.now() + BLOQUEIO_MINUTOS * 60000).toISOString();
        return {
          erro: new ErroNegocio(429, `Muitas tentativas erradas. Acesso bloqueado por ${BLOQUEIO_MINUTOS} min.`),
        };
      }
      const restam = MAX_TENTATIVAS - p.tentativasFalhas;
      return { erro: new ErroNegocio(401, `Nome ou senha inválidos. Restam ${restam} tentativa(s).`) };
    }

    p.tentativasFalhas = 0;
    p.bloqueadoAte = null;
    return { participanteId: p.id, chave: await derivarChave(p, senha) };
  });
  // O erro é lançado só depois de gravar o contador de tentativas.
  if ("erro" in resultado && resultado.erro) throw resultado.erro;
  return resultado as { participanteId: string; chave: string };
}

function participanteDaSessao(g: Grupo, s: Sessao | null) {
  const p = s && g.participantes.find((x) => x.id === s.participanteId);
  if (!p) throw new ErroNegocio(401, "Sua sessão expirou. Entre novamente.");
  return p;
}

export async function meusDados(grupoId: string, s: Sessao | null) {
  const g = await lerGrupo(grupoId);
  const p = participanteDaSessao(g, s);
  return {
    grupo: infoPublica(g),
    eu: { nome: p.nome, listaDesejos: p.listaDesejos, visualizou: p.visualizou },
  };
}

/** RN15 / RN16 / RN20 — devolve só o amigo de quem está logado e a lista DELE. */
export async function revelarAmigo(grupoId: string, s: Sessao | null) {
  return atualizarGrupo(grupoId, (g) => {
    const p = participanteDaSessao(g, s);
    if (g.status !== "sorteado" || !p.amigoCifrado) {
      throw new ErroNegocio(409, "O sorteio ainda não aconteceu.");
    }
    let amigoId: string;
    try {
      amigoId = decifrarCom(p, s!.chave, p.amigoCifrado);
    } catch {
      throw new ErroNegocio(401, "Sua sessão expirou. Entre novamente.");
    }
    const amigo = g.participantes.find((x) => x.id === amigoId);
    if (!amigo) throw new ErroNegocio(500, "Resultado inválido. Peça ao organizador para refazer o sorteio.");
    p.visualizou = true;
    return { nome: amigo.nome, listaDesejos: amigo.listaDesejos };
  });
}

export async function salvarLista(grupoId: string, s: Sessao | null, itens: unknown) {
  if (!Array.isArray(itens)) throw new ErroNegocio(400, "Lista inválida.");
  const limpos = itens
    .filter((i): i is string => typeof i === "string")
    .map((i) => i.trim())
    .filter(Boolean);
  if (limpos.length > MAX_ITENS_LISTA) {
    throw new ErroNegocio(400, `A lista pode ter no máximo ${MAX_ITENS_LISTA} itens.`);
  }
  if (limpos.some((i) => i.length > MAX_TAMANHO_ITEM)) {
    throw new ErroNegocio(400, `Cada item pode ter no máximo ${MAX_TAMANHO_ITEM} caracteres.`);
  }
  return atualizarGrupo(grupoId, (g) => {
    const p = participanteDaSessao(g, s);
    p.listaDesejos = limpos;
    return { listaDesejos: limpos };
  });
}

// ---------------------------------------------------------------- organizador

function exigirAdmin(g: Grupo, token: string | null) {
  if (!token || !iguaisSemVazarTempo(hashToken(token), g.adminTokenHash)) {
    throw new ErroNegocio(403, "Link de organizador inválido.");
  }
}

/** RN02 / RN21 — o organizador vê status, nunca os pares. */
function visaoAdmin(g: Grupo) {
  return {
    grupo: infoPublica(g),
    sorteadoEm: g.sorteadoEm,
    participantes: g.participantes
      .map((p) => ({ id: p.id, nome: p.nome, criadoEm: p.criadoEm, visualizou: p.visualizou }))
      .sort(porNome),
    exclusoes: g.exclusoes,
  };
}

export async function painelAdmin(grupoId: string, token: string | null) {
  const g = await lerGrupo(grupoId);
  exigirAdmin(g, token);
  return visaoAdmin(g);
}

function exigirAberto(g: Grupo, acao: string) {
  if (g.status !== "aberto") {
    throw new ErroNegocio(409, `Para ${acao}, reabra as inscrições (isso cancela o sorteio atual).`);
  }
}

export async function adicionarExclusao(grupoId: string, token: string | null, a: string, b: string) {
  return atualizarGrupo(grupoId, (g) => {
    exigirAdmin(g, token);
    exigirAberto(g, "alterar os casais");
    if (a === b) throw new ErroNegocio(400, "Escolha duas pessoas diferentes.");
    const ids = new Set(g.participantes.map((p) => p.id));
    if (!ids.has(a) || !ids.has(b)) throw new ErroNegocio(400, "Participante não encontrado.");
    if (g.exclusoes.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
      throw new ErroNegocio(409, "Esse par já está cadastrado.");
    }
    g.exclusoes.push([a, b]);
    return visaoAdmin(g);
  });
}

export async function removerExclusao(grupoId: string, token: string | null, a: string, b: string) {
  return atualizarGrupo(grupoId, (g) => {
    exigirAdmin(g, token);
    exigirAberto(g, "alterar os casais");
    g.exclusoes = g.exclusoes.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a)));
    return visaoAdmin(g);
  });
}

export async function removerParticipante(grupoId: string, token: string | null, participanteId: string) {
  return atualizarGrupo(grupoId, (g) => {
    exigirAdmin(g, token);
    exigirAberto(g, "remover alguém"); // RN06
    if (!g.participantes.some((p) => p.id === participanteId)) {
      throw new ErroNegocio(404, "Participante não encontrado.");
    }
    g.participantes = g.participantes.filter((p) => p.id !== participanteId);
    g.exclusoes = g.exclusoes.filter(([x, y]) => x !== participanteId && y !== participanteId);
    return visaoAdmin(g);
  });
}

/** RN08–RN12 / RN14 — sorteia (ou refaz) e grava somente resultados cifrados. */
export async function sortear(grupoId: string, token: string | null) {
  return atualizarGrupo(grupoId, (g) => {
    exigirAdmin(g, token);
    if (g.participantes.length < MIN_PARTICIPANTES) {
      throw new ErroNegocio(409, `São necessários pelo menos ${MIN_PARTICIPANTES} participantes.`);
    }
    let ciclo: Map<string, string> | null = sortearCiclo(
      g.participantes.map((p) => p.id),
      g.exclusoes,
    );
    if (!ciclo) {
      throw new ErroNegocio(
        409,
        "Não existe sorteio possível com essas restrições de casais. Remova algum par ou chame mais gente.",
      );
    }
    for (const p of g.participantes) {
      p.amigoCifrado = cifrarPara(p.chavePublica, ciclo.get(p.id)!);
      p.visualizou = false;
    }
    ciclo.clear();
    ciclo = null; // RN12 — o resultado em claro não fica guardado em lugar nenhum
    g.status = "sorteado";
    g.sorteadoEm = new Date().toISOString();
    return visaoAdmin(g);
  });
}

/** RN06 — cancela o sorteio para permitir mudanças na lista. */
export async function reabrir(grupoId: string, token: string | null) {
  return atualizarGrupo(grupoId, (g) => {
    exigirAdmin(g, token);
    for (const p of g.participantes) {
      p.amigoCifrado = null;
      p.visualizou = false;
    }
    g.status = "aberto";
    g.sorteadoEm = null;
    // Se o prazo já passou, reabrir também libera novos cadastros (ex.: quem esqueceu a senha).
    if (prazoEncerrado(g)) g.prazoCadastro = null;
    return visaoAdmin(g);
  });
}
