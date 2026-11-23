import { NextRequest } from "next/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as rotaAdmin from "@/app/api/grupos/[id]/admin/route";
import * as rotaExclusoes from "@/app/api/grupos/[id]/admin/exclusoes/route";
import * as rotaSortear from "@/app/api/grupos/[id]/admin/sortear/route";
import * as rotaCadastro from "@/app/api/grupos/[id]/cadastro/route";
import * as rotaEu from "@/app/api/grupos/[id]/eu/route";
import * as rotaLista from "@/app/api/grupos/[id]/lista/route";
import * as rotaLogin from "@/app/api/grupos/[id]/login/route";
import * as rotaLogout from "@/app/api/grupos/[id]/logout/route";
import * as rotaRevelar from "@/app/api/grupos/[id]/revelar/route";
import * as rotaGrupo from "@/app/api/grupos/[id]/route";
import * as rotaGrupos from "@/app/api/grupos/route";

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

/** Um "navegador" de mentira: guarda os cookies entre as chamadas, como um browser real. */
class Navegador {
  cookies = new Map<string, string>();
  ultimoSetCookie: string[] = [];

  async chamar(
    handler: Handler,
    params: Record<string, string>,
    opcoes: { metodo?: string; corpo?: unknown; corpoBruto?: string; admin?: string; url?: string; https?: boolean } = {},
  ) {
    const headers = new Headers();
    if (opcoes.corpo !== undefined || opcoes.corpoBruto !== undefined) headers.set("content-type", "application/json");
    if (opcoes.admin !== undefined) headers.set("x-admin-token", opcoes.admin);
    if (opcoes.https) headers.set("x-forwarded-proto", "https");
    if (this.cookies.size) headers.set("cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    const req = new NextRequest(opcoes.url ?? "http://localhost:3000/api/teste", {
      method: opcoes.metodo ?? "GET",
      headers,
      body: opcoes.corpoBruto ?? (opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined),
    });
    const res = await handler(req, { params: Promise.resolve(params) });
    this.ultimoSetCookie = res.headers.getSetCookie();
    for (const linha of this.ultimoSetCookie) {
      const [par] = linha.split(";");
      const [nome, ...resto] = par.split("=");
      const valor = resto.join("=");
      if (/max-age=0/i.test(linha) || valor === "") this.cookies.delete(nome);
      else this.cookies.set(nome, valor);
    }
    const json = await res.json().catch(() => null);
    return { status: res.status, json, headers: res.headers };
  }
}

const NOMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa"];

describe("API HTTP — fluxo completo", () => {
  const organizador = new Navegador();
  const pessoas: Record<string, Navegador> = {};
  let id: string;
  let token: string;

  beforeAll(async () => {
    const r = await organizador.chamar(rotaGrupos.POST as Handler, {}, {
      metodo: "POST",
      corpo: { nome: "Natal HTTP", dataTroca: "2099-12-24", valorSugerido: "R$ 80", prazoCadastro: "" },
    });
    expect(r.status).toBe(201);
    id = r.json.id;
    token = r.json.adminToken;

    for (const nome of NOMES) {
      pessoas[nome] = new Navegador();
      const c = await pessoas[nome].chamar(rotaCadastro.POST as Handler, { id }, {
        metodo: "POST",
        corpo: { nome, senha: `senha-${nome}` },
      });
      expect(c.status).toBe(201);
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cadastro já deixa a pessoa logada com cookie seguro (httpOnly, SameSite=Strict)", async () => {
    const nav = new Navegador();
    await nav.chamar(rotaCadastro.POST as Handler, { id }, { metodo: "POST", corpo: { nome: "Fabi", senha: "1234" } });
    const linha = nav.ultimoSetCookie[0];
    expect(linha).toMatch(new RegExp(`^treno_${id}=`));
    expect(linha).toMatch(/HttpOnly/i);
    expect(linha).toMatch(/SameSite=Strict/i);
    expect(linha).toMatch(/Path=\//i);
    expect(linha).not.toMatch(/Secure/i); // http local
    // O cookie não contém a senha em texto puro.
    expect(decodeURIComponent(linha)).not.toContain("1234");
  });

  it("em HTTPS (atrás de proxy) o cookie vai com Secure", async () => {
    const nav = new Navegador();
    await nav.chamar(rotaLogin.POST as Handler, { id }, {
      metodo: "POST",
      corpo: { nome: "Ana", senha: "senha-Ana" },
      https: true,
    });
    expect(nav.ultimoSetCookie[0]).toMatch(/Secure/i);
  });

  it("sem cookie, /eu responde 401 e o público vê só os nomes", async () => {
    const anonimo = new Navegador();
    expect((await anonimo.chamar(rotaEu.GET as Handler, { id })).status).toBe(401);
    const pub = await anonimo.chamar(rotaGrupo.GET as Handler, { id });
    expect(pub.status).toBe(200);
    expect(pub.json.participantes.every((p: object) => Object.keys(p).join() === "nome")).toBe(true);
  });

  it("organizador: token pelo cabeçalho funciona; errado, ausente ou na URL não", async () => {
    expect((await organizador.chamar(rotaAdmin.GET as Handler, { id }, { admin: token })).status).toBe(200);
    expect((await organizador.chamar(rotaAdmin.GET as Handler, { id }, { admin: "errado" })).status).toBe(403);
    expect((await organizador.chamar(rotaAdmin.GET as Handler, { id })).status).toBe(403);
    expect(
      (await organizador.chamar(rotaAdmin.GET as Handler, { id }, { url: `http://localhost/api?token=${token}` })).status,
    ).toBe(403);
    // Participante logado não vira organizador.
    expect((await pessoas.Ana.chamar(rotaSortear.POST as Handler, { id }, { metodo: "POST" })).status).toBe(403);
  });

  it("revelação ponta a ponta: cada navegador vê só o seu amigo, respeitando o casal", async () => {
    const painel = await organizador.chamar(rotaAdmin.GET as Handler, { id }, { admin: token });
    const idDe = (n: string) => painel.json.participantes.find((p: { nome: string }) => p.nome === n).id;
    const casal = await organizador.chamar(rotaExclusoes.POST as Handler, { id }, {
      metodo: "POST",
      admin: token,
      corpo: { a: idDe("Ana"), b: idDe("Bruno") },
    });
    expect(casal.status).toBe(200);

    await pessoas.Carla.chamar(rotaLista.PUT as Handler, { id }, { metodo: "PUT", corpo: { itens: ["Vinho", "Livro"] } });

    const s = await organizador.chamar(rotaSortear.POST as Handler, { id }, { metodo: "POST", admin: token });
    expect(s.status).toBe(200);
    expect(JSON.stringify(s.json)).not.toMatch(/amigo|cifrado/i);

    const tirou: Record<string, string> = {};
    for (const nome of NOMES) {
      const r = await pessoas[nome].chamar(rotaRevelar.POST as Handler, { id }, { metodo: "POST" });
      expect(r.status).toBe(200);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(Object.keys(r.json).sort()).toEqual(["listaDesejos", "nome"]);
      tirou[nome] = r.json.nome;
      if (r.json.nome === "Carla") expect(r.json.listaDesejos).toEqual(["Vinho", "Livro"]);
    }
    // A "Fabi" de um teste anterior também participa; checamos os 5 principais.
    for (const nome of NOMES) expect(tirou[nome]).not.toBe(nome);
    expect(tirou.Ana).not.toBe("Bruno");
    expect(tirou.Bruno).not.toBe("Ana");

    const status = await organizador.chamar(rotaAdmin.GET as Handler, { id }, { admin: token });
    expect(status.json.participantes.filter((p: { visualizou: boolean }) => p.visualizou).length).toBe(NOMES.length);
  });

  it("cookie adulterado, trocado de grupo ou expirado é recusado", async () => {
    const original = pessoas.Diego.cookies.get(`treno_${id}`)!;

    const adulterado = new Navegador();
    const trocado = original.slice(0, 20) + (original[20] === "A" ? "B" : "A") + original.slice(21);
    adulterado.cookies.set(`treno_${id}`, trocado);
    expect((await adulterado.chamar(rotaRevelar.POST as Handler, { id }, { metodo: "POST" })).status).toBe(401);

    // Mesmo cookie válido, mas apresentado para outro grupo.
    const outro = await organizador.chamar(rotaGrupos.POST as Handler, {}, {
      metodo: "POST",
      corpo: { nome: "Outro grupo", dataTroca: "2099-12-24", valorSugerido: "", prazoCadastro: "" },
    });
    const intruso = new Navegador();
    intruso.cookies.set(`treno_${outro.json.id}`, original);
    expect((await intruso.chamar(rotaEu.GET as Handler, { id: outro.json.id })).status).toBe(401);

    // 13 horas depois a sessão (12h) expira.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 13 * 60 * 60 * 1000);
    expect((await pessoas.Diego.chamar(rotaEu.GET as Handler, { id })).status).toBe(401);
    vi.useRealTimers();
    expect((await pessoas.Diego.chamar(rotaEu.GET as Handler, { id })).status).toBe(200);
  });

  it("logout apaga o cookie e corta o acesso", async () => {
    const nav = new Navegador();
    await nav.chamar(rotaLogin.POST as Handler, { id }, { metodo: "POST", corpo: { nome: "Elisa", senha: "senha-Elisa" } });
    expect((await nav.chamar(rotaEu.GET as Handler, { id })).status).toBe(200);
    await nav.chamar(rotaLogout.POST as Handler, { id }, { metodo: "POST" });
    expect(nav.cookies.size).toBe(0);
    expect((await nav.chamar(rotaRevelar.POST as Handler, { id }, { metodo: "POST" })).status).toBe(401);
  });

  it("corpo malformado vira 400 com mensagem amigável, sem detalhes internos", async () => {
    const r = await new Navegador().chamar(rotaLogin.POST as Handler, { id }, { metodo: "POST", corpoBruto: "{nao é json" });
    expect(r.status).toBe(400);
    expect(r.json).toEqual({ erro: "Requisição inválida." });
  });

  it("nenhuma resposta pública ou do organizador permite reconstruir os pares", async () => {
    const respostas = [
      await new Navegador().chamar(rotaGrupo.GET as Handler, { id }),
      await organizador.chamar(rotaAdmin.GET as Handler, { id }, { admin: token }),
      await pessoas.Ana.chamar(rotaEu.GET as Handler, { id }),
    ];
    for (const r of respostas) {
      expect(JSON.stringify(r.json)).not.toMatch(/amigo|cifrad|chave|senha|salt|tirou/i);
    }
  });
});
