import { describe, expect, it } from "vitest";
import { sortearCiclo } from "@/lib/sorteio";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

/** Percorre o resultado a partir de uma pessoa e conta quantas visita antes de voltar. */
function tamanhoDoCiclo(resultado: Map<string, string>, inicio: string) {
  let atual = resultado.get(inicio)!;
  let passos = 1;
  while (atual !== inicio) {
    atual = resultado.get(atual)!;
    passos++;
    if (passos > resultado.size + 1) throw new Error("loop sem fim");
  }
  return passos;
}

describe("sorteio (RN08, RN09, RN10, RN11)", () => {
  it.each([3, 4, 5, 8, 15, 40])("com %i pessoas: todo mundo dá e recebe exatamente um presente", (n) => {
    for (let rodada = 0; rodada < 50; rodada++) {
      const r = sortearCiclo(ids(n), [])!;
      expect(r).not.toBeNull();
      expect(r.size).toBe(n);
      expect(new Set(r.values()).size).toBe(n); // ninguém é tirado duas vezes
      expect([...r.values()].sort()).toEqual(ids(n).sort());
    }
  });

  it("RN08: ninguém tira a si mesmo", () => {
    for (let rodada = 0; rodada < 500; rodada++) {
      const r = sortearCiclo(ids(6), [])!;
      for (const [quem, tirou] of r) expect(tirou).not.toBe(quem);
    }
  });

  it("RN09: forma um único ciclo (sem pares fechados A↔B)", () => {
    for (let rodada = 0; rodada < 500; rodada++) {
      const n = 3 + (rodada % 10);
      const r = sortearCiclo(ids(n), [])!;
      expect(tamanhoDoCiclo(r, "p0")).toBe(n);
    }
  });

  it("RN10: casais nunca se tiram, em nenhum dos dois sentidos", () => {
    const casais: [string, string][] = [
      ["p0", "p1"],
      ["p2", "p3"],
      ["p4", "p5"],
    ];
    for (let rodada = 0; rodada < 1000; rodada++) {
      const r = sortearCiclo(ids(7), casais)!;
      expect(r).not.toBeNull();
      for (const [a, b] of casais) {
        expect(r.get(a)).not.toBe(b);
        expect(r.get(b)).not.toBe(a);
      }
    }
  });

  it("retorna null quando as restrições tornam o sorteio impossível", () => {
    // Com 3 pessoas o ciclo A→B→C→A sempre liga todo mundo; um casal torna impossível.
    expect(sortearCiclo(ids(3), [["p0", "p1"]], 2000)).toBeNull();
    // 4 pessoas em que p0 é "casal" de todo mundo.
    expect(
      sortearCiclo(
        ids(4),
        [
          ["p0", "p1"],
          ["p0", "p2"],
          ["p0", "p3"],
        ],
        2000,
      ),
    ).toBeNull();
  });

  it("RN07: menos de 3 pessoas não sorteia", () => {
    expect(sortearCiclo(ids(2), [])).toBeNull();
    expect(sortearCiclo(ids(1), [])).toBeNull();
    expect(sortearCiclo([], [])).toBeNull();
  });

  it("RN11: é aleatório e sem viés (cada pessoa possível aparece com frequência parecida)", () => {
    // Com 5 pessoas, p0 pode tirar qualquer um dos outros 4. Esperado: ~25% cada.
    const contagem: Record<string, number> = {};
    const rodadas = 8000;
    for (let i = 0; i < rodadas; i++) {
      const tirou = sortearCiclo(ids(5), [])!.get("p0")!;
      contagem[tirou] = (contagem[tirou] ?? 0) + 1;
    }
    expect(Object.keys(contagem).sort()).toEqual(["p1", "p2", "p3", "p4"]);
    for (const v of Object.values(contagem)) {
      expect(v / rodadas).toBeGreaterThan(0.21);
      expect(v / rodadas).toBeLessThan(0.29);
    }
  });
});
