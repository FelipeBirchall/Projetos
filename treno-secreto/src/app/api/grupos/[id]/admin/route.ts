import { ok, rota } from "@/lib/http";
import { painelAdmin } from "@/lib/regras";

export const GET = rota(async (req, { id }) => ok(await painelAdmin(id, req.headers.get("x-admin-token"))));
