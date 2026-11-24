import { ok, rota } from "@/lib/http";
import { reabrir } from "@/lib/regras";

export const POST = rota(async (req, { id }) => ok(await reabrir(id, req.headers.get("x-admin-token"))));
