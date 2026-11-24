import { describe, expect, it } from "vitest";
import { atualizarGrupo } from "@/lib/armazenamento";
import { faixaDeValor, formatarReais } from "@/lib/cliente";
import { criarNovoGrupo, obterInfoPublica, paraCentavos } from "@/lib/regras";
import { ErroNegocio } from "@/lib/tipos";

// toLocaleString usa espaço não separável entre "R$" e o número; normalizamos para comparar.
const semNbsp = (t: string) => t.replace(/ /g, " ");

function esperaErro400(fn: () => unknown, trecho: string) {
  let erro: unknown = null;
  try {
    fn();
  } catch (e) {
    erro = e;
  }
  expect(erro).toBeInstanceOf(ErroNegocio);
  expect((erro as ErroNegocio).status).toBe(400);
  expect((erro as ErroNegocio).message).toContain(trecho);
}

const grupo = (valorMinimo: unknown, valorMaximo: unknown) =>
  criarNovoGrupo({ nome: "Grupo de valores", dataTroca: "2099-12-24", valorMinimo, valorMaximo, prazoCadastro: "" });

describe("conversão do valor digitado para centavos", () => {
  it.each([
    ["50", 5000],
    ["49,90", 4990],
    ["49.90", 4990],
    ["49,9", 4990],
    ["R$ 120", 12000],
    ["R$ 1.000,00", 100000],
    ["1.000", 100000],
    [" 75 ", 7500],
    [50, 5000],
    [49.9, 4990],
    [0, 0],
  ])("%j vira %i centavos", (entrada, centavos) => {
    expect(paraCentavos(entrada, "Valor")).toBe(centavos);
  });

  it.each([[""], ["   "], [null], [undefined]])("%j significa sem limite (null)", (entrada) => {
    expect(paraCentavos(entrada, "Valor")).toBeNull();
  });

  it("recusa valores negativos, texto, casas decimais demais e valores absurdos", () => {
    esperaErro400(() => paraCentavos("-5", "Valor mínimo"), "não pode ser negativo");
    esperaErro400(() => paraCentavos(-1, "Valor mínimo"), "não pode ser negativo");
    esperaErro400(() => paraCentavos("abc", "Valor máximo"), "inválido");
    esperaErro400(() => paraCentavos("10,999", "Valor máximo"), "inválido");
    esperaErro400(() => paraCentavos({}, "Valor máximo"), "inválido");
    esperaErro400(() => paraCentavos(100001, "Valor máximo"), "alto demais");
  });
});

describe("faixa de valor do grupo", () => {
  it("guarda mínimo e máximo em centavos e devolve nas informações públicas", async () => {
    const { id } = await grupo("50", "100,50");
    const info = await obterInfoPublica(id);
    expect(info.valorMinimo).toBe(5000);
    expect(info.valorMaximo).toBe(10050);
  });

  it("mínimo maior que o máximo é recusado", async () => {
    const erro = await grupo("150", "100").then(
      () => null,
      (e) => e,
    );
    expect(erro).toBeInstanceOf(ErroNegocio);
    expect(erro.message).toContain("mínimo não pode ser maior");
  });

  it("aceita só um dos dois, ou nenhum, e mínimo igual ao máximo", async () => {
    const soMin = await obterInfoPublica((await grupo("30", "")).id);
    expect([soMin.valorMinimo, soMin.valorMaximo]).toEqual([3000, null]);
    const soMax = await obterInfoPublica((await grupo("", 80)).id);
    expect([soMax.valorMinimo, soMax.valorMaximo]).toEqual([null, 8000]);
    const nenhum = await obterInfoPublica((await grupo("", "")).id);
    expect([nenhum.valorMinimo, nenhum.valorMaximo]).toEqual([null, null]);
    const igual = await obterInfoPublica((await grupo("60", "60")).id);
    expect([igual.valorMinimo, igual.valorMaximo]).toEqual([6000, 6000]);
  });

  it("grupos antigos, só com o 'valor sugerido' em texto, continuam aparecendo", async () => {
    const { id } = await grupo("", "");
    await atualizarGrupo(id, (g) => {
      delete g.valorMinimo;
      delete g.valorMaximo;
      g.valorSugerido = "R$ 80"; // como era gravado antes
    });
    const info = await obterInfoPublica(id);
    expect(info).toMatchObject({ valorMinimo: null, valorMaximo: null, valorSugerido: "R$ 80" });
    expect(faixaDeValor(info)).toBe("R$ 80");
  });
});

describe("texto exibido no site", () => {
  it.each([
    [5000, 10000, "R$ 50 a R$ 100"],
    [4990, 9990, "R$ 49,90 a R$ 99,90"],
    [5000, 5000, "R$ 50"],
    [5000, null, "A partir de R$ 50"],
    [null, 10000, "Até R$ 100"],
    [null, null, ""],
    [100000, 150000, "R$ 1.000 a R$ 1.500"],
  ])("mínimo %j e máximo %j → %s", (valorMinimo, valorMaximo, esperado) => {
    expect(semNbsp(faixaDeValor({ valorMinimo, valorMaximo, valorSugerido: "" }))).toBe(esperado);
  });

  it("formata centavos em reais", () => {
    expect(semNbsp(formatarReais(1))).toBe("R$ 0,01");
    expect(semNbsp(formatarReais(12345))).toBe("R$ 123,45");
  });
});
