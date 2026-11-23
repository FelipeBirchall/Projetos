import { ok, rota } from "@/lib/http";
import { obterInfoPublica } from "@/lib/regras";

export const GET = rota(async (_req, { id }) => ok(await obterInfoPublica(id)));
