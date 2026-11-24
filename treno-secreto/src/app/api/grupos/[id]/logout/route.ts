import { ok, rota } from "@/lib/http";
import { encerrarSessao } from "@/lib/sessao";

export const POST = rota(async (_req, { id }) => {
  const res = ok();
  encerrarSessao(res, id);
  return res;
});
