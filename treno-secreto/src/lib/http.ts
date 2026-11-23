import { NextResponse, type NextRequest } from "next/server";
import { ErroNegocio } from "./tipos";

export type Contexto = { params: Promise<Record<string, string>> };

type Manipulador = (req: NextRequest, params: Record<string, string>) => Promise<NextResponse>;

/** Converte ErroNegocio em resposta JSON e nunca vaza detalhes internos. */
export function rota(fn: Manipulador) {
  return async (req: NextRequest, ctx: Contexto) => {
    try {
      const resposta = await fn(req, await ctx.params);
      resposta.headers.set("Cache-Control", "no-store");
      return resposta;
    } catch (e) {
      if (e instanceof ErroNegocio) {
        return NextResponse.json({ erro: e.message }, { status: e.status });
      }
      console.error("[treno-secreto] erro inesperado:", (e as Error)?.message);
      return NextResponse.json({ erro: "Algo deu errado. Tente novamente." }, { status: 500 });
    }
  };
}

export async function corpoJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const corpo = await req.json();
    return corpo && typeof corpo === "object" ? corpo : {};
  } catch {
    throw new ErroNegocio(400, "Requisição inválida.");
  }
}

export function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

export function ok(dados: unknown = { ok: true }, status = 200) {
  return NextResponse.json(dados, { status });
}
