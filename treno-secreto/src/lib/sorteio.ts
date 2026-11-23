import crypto from "crypto";

function embaralhar<T>(lista: T[]) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1); // RN11 — aleatoriedade criptográfica
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * RN08 / RN09 / RN10 — sorteia UM único ciclo (A→B→C→…→A) respeitando as exclusões.
 * Usa amostragem por rejeição: todos os ciclos válidos têm a mesma chance.
 * Retorna um mapa "quem dá" → "quem recebe", ou null se for impossível.
 */
export function sortearCiclo(ids: string[], exclusoes: [string, string][], tentativas = 50000) {
  if (ids.length < 3) return null;
  const proibidos = new Set<string>();
  for (const [a, b] of exclusoes) {
    proibidos.add(`${a}|${b}`);
    proibidos.add(`${b}|${a}`);
  }

  for (let t = 0; t < tentativas; t++) {
    const ordem = embaralhar(ids);
    let valido = true;
    for (let i = 0; i < ordem.length; i++) {
      const proximo = ordem[(i + 1) % ordem.length];
      if (proibidos.has(`${ordem[i]}|${proximo}`)) {
        valido = false;
        break;
      }
    }
    if (valido) {
      const resultado = new Map<string, string>();
      ordem.forEach((id, i) => resultado.set(id, ordem[(i + 1) % ordem.length]));
      return resultado;
    }
  }
  return null;
}
