import { ok, rota } from "@/lib/http";
import { removerParticipante } from "@/lib/regras";

export const DELETE = rota(async (req, { id, pid }) =>
  ok(await removerParticipante(id, req.headers.get("x-admin-token"), pid)),
);
