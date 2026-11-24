/**
 * Servidor Upstash de mentira, para testes.
 *
 * Diferente de um "cliente falso", aqui usamos o cliente REAL (@upstash/redis) e
 * interceptamos só o fetch: o cliente monta as requisições HTTP de verdade e lê as
 * respostas do jeito dele. Comandos EVAL executam o script Lua de verdade, num
 * interpretador Lua (fengari), com um redis.call que imita o Redis.
 */
// @ts-expect-error fengari não tem tipos publicados
import { lauxlib, lua, lualib, to_jsstring, to_luastring } from "fengari";

type Hash = Map<string, string>;

export function criarUpstashFalso(opcoes: { atrasoMaxMs?: number } = {}) {
  const banco = new Map<string, Hash>();
  const expiraEm = new Map<string, number>();
  const stats = { requisicoes: 0, comandos: [] as string[], conflitos: 0, gravacoes: 0 };

  /** Executa um comando Redis sobre o banco em memória (subconjunto usado pelo projeto). */
  function executar(cmd: string[]): unknown {
    const [nome, ...a] = cmd;
    switch (nome.toLowerCase()) {
      case "hget":
        return banco.get(a[0])?.get(a[1]) ?? null;
      case "hset": {
        const h = banco.get(a[0]) ?? new Map();
        let novos = 0;
        for (let i = 1; i < a.length; i += 2) {
          if (!h.has(a[i])) novos++;
          h.set(a[i], a[i + 1]);
        }
        banco.set(a[0], h);
        return novos;
      }
      case "hgetall": {
        const h = banco.get(a[0]);
        return h ? [...h].flat() : [];
      }
      case "expireat":
        if (!banco.has(a[0])) return 0;
        expiraEm.set(a[0], Number(a[1]));
        return 1;
      case "del":
        return a.filter((k) => banco.delete(k)).length;
      default:
        throw new Error(`comando não suportado no falso: ${nome}`);
    }
  }

  /** Roda um script Lua como o EVAL do Redis: KEYS, ARGV e redis.call. */
  function eval_(script: string, chaves: string[], args: string[]) {
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    const tabela = (nome: string, valores: string[]) => {
      lua.lua_createtable(L, valores.length, 0);
      valores.forEach((v, i) => {
        lua.lua_pushstring(L, to_luastring(v));
        lua.lua_rawseti(L, -2, i + 1);
      });
      lua.lua_setglobal(L, to_luastring(nome));
    };
    tabela("KEYS", chaves);
    tabela("ARGV", args);

    lua.lua_createtable(L, 0, 1);
    lua.lua_pushcfunction(L, (Ls: unknown) => {
      const n = lua.lua_gettop(Ls);
      const partes: string[] = [];
      for (let i = 1; i <= n; i++) partes.push(to_jsstring(lua.lua_tolstring(Ls, i)));
      const r = executar(partes);
      // Conversão Redis → Lua: nil vira false; número vira inteiro; texto vira string.
      if (r === null) lua.lua_pushboolean(Ls, false);
      else if (typeof r === "number") lua.lua_pushinteger(Ls, r);
      else lua.lua_pushstring(Ls, to_luastring(String(r)));
      return 1;
    });
    lua.lua_setfield(L, -2, to_luastring("call"));
    lua.lua_setglobal(L, to_luastring("redis"));

    if (lauxlib.luaL_loadstring(L, to_luastring(script)) !== lua.LUA_OK) {
      throw new Error("Erro de sintaxe no Lua: " + to_jsstring(lua.lua_tostring(L, -1)));
    }
    if (lua.lua_pcall(L, 0, 1, 0) !== lua.LUA_OK) {
      throw new Error("Erro ao executar Lua: " + to_jsstring(lua.lua_tostring(L, -1)));
    }
    // Conversão Lua → Redis: número vira inteiro; false/nil vira null.
    if (lua.lua_isinteger(L, -1)) return Number(lua.lua_tointeger(L, -1));
    if (lua.lua_isstring(L, -1)) return to_jsstring(lua.lua_tostring(L, -1));
    return null;
  }

  function rodarComando(bruto: unknown[]) {
    const cmd = bruto.map(String);
    stats.comandos.push(cmd[0].toLowerCase());
    if (cmd[0].toLowerCase() === "eval") {
      const nChaves = Number(cmd[2]);
      const chaves = cmd.slice(3, 3 + nChaves);
      const args = cmd.slice(3 + nChaves);
      const result = eval_(cmd[1], chaves, args);
      if (result === 1) stats.gravacoes++;
      else stats.conflitos++;
      return result;
    }
    return executar(cmd);
  }

  async function fetchFalso(url: string | URL | Request, init?: RequestInit) {
    stats.requisicoes++;
    const atraso = opcoes.atrasoMaxMs ?? 6;
    if (atraso) await new Promise((r) => setTimeout(r, Math.random() * atraso));
    const corpo = JSON.parse(String(init?.body)) as unknown[];

    // Pipeline (o cliente agrupa comandos sozinho): corpo = [[cmd...], [cmd...]], resposta = [{result}, ...]
    if (String(url).endsWith("/pipeline") || Array.isArray(corpo[0])) {
      const respostas = (corpo as unknown[][]).map((c) => {
        try {
          return { result: rodarComando(c) };
        } catch (e) {
          return { error: (e as Error).message };
        }
      });
      return new Response(JSON.stringify(respostas), { status: 200 });
    }

    try {
      return new Response(JSON.stringify({ result: rodarComando(corpo) }), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), { status: 400 });
    }
  }

  return { fetch: fetchFalso, banco, expiraEm, stats };
}
