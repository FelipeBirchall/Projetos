import { corpoJson, ok, rota, texto } from "@/lib/http";
import { adicionarExclusao, removerExclusao } from "@/lib/regras";

export const POST = rota(async (req, { id }) => {
  const c = await corpoJson(req);
  return ok(await adicionarExclusao(id, req.headers.get("x-admin-token"), texto(c.a), texto(c.b)));
});

export const DELETE = rota(async (req, { id }) => {
  const c = await corpoJson(req);
  return ok(await removerExclusao(id, req.headers.get("x-admin-token"), texto(c.a), texto(c.b)));
});
