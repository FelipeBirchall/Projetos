import { corpoJson, ok, rota, texto } from "@/lib/http";
import { criarNovoGrupo } from "@/lib/regras";

export const POST = rota(async (req) => {
  const c = await corpoJson(req);
  const criado = await criarNovoGrupo({
    nome: texto(c.nome),
    dataTroca: texto(c.dataTroca),
    valorMinimo: c.valorMinimo,
    valorMaximo: c.valorMaximo,
    prazoCadastro: texto(c.prazoCadastro),
  });
  return ok(criado, 201);
});
