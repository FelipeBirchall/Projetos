import { ok, rota } from "@/lib/http";
import { meusDados } from "@/lib/regras";
import { lerSessao } from "@/lib/sessao";

export const GET = rota(async (req, { id }) => ok(await meusDados(id, lerSessao(req, id))));
