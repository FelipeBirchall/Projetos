import { ok, rota } from "@/lib/http";
import { revelarAmigo } from "@/lib/regras";
import { lerSessao } from "@/lib/sessao";

export const POST = rota(async (req, { id }) => ok(await revelarAmigo(id, lerSessao(req, id))));
