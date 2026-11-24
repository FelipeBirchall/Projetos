import { corpoJson, ok, rota, texto } from "@/lib/http";
import { entrar } from "@/lib/regras";
import { iniciarSessao } from "@/lib/sessao";

export const POST = rota(async (req, { id }) => {
  const c = await corpoJson(req);
  const senha = typeof c.senha === "string" ? c.senha : "";
  const { participanteId, chave } = await entrar(id, texto(c.nome), senha);
  const res = ok();
  iniciarSessao(req, res, { grupoId: id, participanteId, chave });
  return res;
});
