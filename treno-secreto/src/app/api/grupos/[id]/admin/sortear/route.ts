import { ok, rota } from "@/lib/http";
import { sortear } from "@/lib/regras";

export const POST = rota(async (req, { id }) => ok(await sortear(id, req.headers.get("x-admin-token"))));
