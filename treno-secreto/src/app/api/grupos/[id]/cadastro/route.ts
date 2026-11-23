import { corpoJson, ok, rota, texto } from "@/lib/http";
import { cadastrar } from "@/lib/regras";
import { iniciarSessao } from "@/lib/sessao";

export const POST = rota(async (req, { id }) => {
  const c = await corpoJson(req);
  const senha = typeof c.senha === "string" ? c.senha : "";
  const { participanteId, chave } = await cadastrar(id, texto(c.nome), senha);
  const res = ok({ ok: true }, 201);
  iniciarSessao(req, res, { grupoId: id, participanteId, chave });
  return res;
});
