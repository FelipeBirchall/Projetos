import { corpoJson, ok, rota } from "@/lib/http";
import { salvarLista } from "@/lib/regras";
import { lerSessao } from "@/lib/sessao";

export const PUT = rota(async (req, { id }) => {
  const c = await corpoJson(req);
  return ok(await salvarLista(id, lerSessao(req, id), c.itens));
});
