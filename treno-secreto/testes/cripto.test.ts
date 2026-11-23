import { describe, expect, it } from "vitest";
import {
  cifrarPara,
  criarCredenciais,
  decifrarCom,
  derivarChave,
  hashToken,
  novoId,
  novoToken,
  senhaConfere,
} from "@/lib/cripto";
import type { Participante } from "@/lib/tipos";

async function participante(senha: string): Promise<{ p: Participante; chave: string }> {
  const c = await criarCredenciais(senha);
  const p: Participante = {
    id: novoId(),
    nome: "Teste",
    criadoEm: new Date().toISOString(),
    senhaHash: c.senhaHash,
    saltSenha: c.saltSenha,
    saltChave: c.saltChave,
    chavePublica: c.chavePublica,
    chavePrivadaCifrada: c.chavePrivadaCifrada,
    amigoCifrado: null,
    visualizou: false,
    listaDesejos: [],
    tentativasFalhas: 0,
    bloqueadoAte: null,
  };
  return { p, chave: c.chave };
}

describe("criptografia (RN13, RN14, RN15)", () => {
  it("o dono da senha consegue abrir o amigo cifrado para ele", async () => {
    const { p, chave } = await participante("natal123");
    const cifrado = cifrarPara(p.chavePublica, "idDoAmigo1");
    expect(cifrado).not.toContain("idDoAmigo1");
    expect(decifrarCom(p, chave, cifrado)).toBe("idDoAmigo1");
  });

  it("a chave derivada no login é a mesma gerada no cadastro", async () => {
    const { p, chave } = await participante("minha senha secreta");
    expect(await derivarChave(p, "minha senha secreta")).toBe(chave);
  });

  it("senha errada não abre o resultado", async () => {
    const { p } = await participante("natal123");
    const cifrado = cifrarPara(p.chavePublica, "idDoAmigo1");
    const chaveErrada = await derivarChave(p, "natal124");
    expect(() => decifrarCom(p, chaveErrada, cifrado)).toThrow();
  });

  it("um participante não consegue abrir o resultado de outro", async () => {
    const ana = await participante("senhaAna");
    const bruno = await participante("senhaBruno");
    const doBruno = cifrarPara(bruno.p.chavePublica, "idSecreto");
    // Ana tenta usar a própria chave na chave privada do Bruno, e também na dela.
    expect(() => decifrarCom(bruno.p, ana.chave, doBruno)).toThrow();
    expect(() => decifrarCom(ana.p, ana.chave, doBruno)).toThrow();
  });

  it("o mesmo texto cifrado duas vezes gera resultados diferentes (OAEP aleatório)", async () => {
    const { p } = await participante("natal123");
    expect(cifrarPara(p.chavePublica, "x")).not.toBe(cifrarPara(p.chavePublica, "x"));
  });

  it("verificação de senha aceita só a senha correta", async () => {
    const { p } = await participante("Natal123");
    expect(await senhaConfere(p, "Natal123")).toBe(true);
    expect(await senhaConfere(p, "natal123")).toBe(false);
    expect(await senhaConfere(p, "")).toBe(false);
  });

  it("nada da senha aparece em texto puro nas credenciais guardadas", async () => {
    const { p } = await participante("senhaSuperUnica987");
    expect(JSON.stringify(p)).not.toContain("senhaSuperUnica987");
    expect(p.chavePrivadaCifrada).toContain("ENCRYPTED PRIVATE KEY");
  });

  it("ids e tokens têm o formato esperado e não se repetem", () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const id = novoId();
      expect(id).toMatch(/^[a-z0-9]{10}$/);
      vistos.add(id);
    }
    expect(vistos.size).toBe(2000);
    const token = novoToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(token)).not.toContain(token);
  });
});
