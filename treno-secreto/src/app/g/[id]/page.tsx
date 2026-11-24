"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Aviso, AvisoSigilo, Cabecalho, CampoSenha, Carregando, DetalhesGrupo } from "@/components/Comuns";
import { Avatar, Enfeite, Floco, IconeArvore, IconeChave, IconeGorro, IconePresente } from "@/components/Icones";
import ListaDesejosEditor from "@/components/ListaDesejosEditor";
import Presente from "@/components/Presente";
import { api, ErroApi, type InfoGrupo } from "@/lib/cliente";

type Eu = { nome: string; listaDesejos: string[]; visualizou: boolean };

/** Tenta os dados de quem está logado; sem sessão, cai para as informações públicas do grupo. */
async function buscarDados(id: string): Promise<{ grupo: InfoGrupo | null; eu: Eu | null; erro: string }> {
  try {
    const dados = await api<{ grupo: InfoGrupo; eu: Eu }>(`/api/grupos/${id}/eu`);
    return { grupo: dados.grupo, eu: dados.eu, erro: "" };
  } catch (e) {
    if (!(e instanceof ErroApi && e.status === 401)) return { grupo: null, eu: null, erro: (e as Error).message };
    try {
      return { grupo: await api<InfoGrupo>(`/api/grupos/${id}`), eu: null, erro: "" };
    } catch (e2) {
      return { grupo: null, eu: null, erro: (e2 as Error).message };
    }
  }
}

export default function PaginaDoGrupo() {
  const { id } = useParams<{ id: string }>();
  const [grupo, setGrupo] = useState<InfoGrupo | null>(null);
  const [eu, setEu] = useState<Eu | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroGeral, setErroGeral] = useState("");
  const [versao, setVersao] = useState(0);
  const carregar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    let ativo = true;
    buscarDados(id).then((r) => {
      if (!ativo) return;
      setGrupo(r.grupo);
      setEu(r.eu);
      setErroGeral(r.erro);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [id, versao]);

  async function sair() {
    await api(`/api/grupos/${id}/logout`, { metodo: "POST" });
    carregar();
  }

  if (carregando) return <Carregando />;

  if (!grupo) {
    return (
      <>
        <Cabecalho />
        <section className="cartao">
          <h2>Ops! Grupo não encontrado</h2>
          <Aviso tipo="erro">{erroGeral || "Confira se o link está completo."}</Aviso>
        </section>
      </>
    );
  }

  return (
    <>
      <Cabecalho subtitulo={eu ? `Feliz Natal, ${eu.nome}!` : "Você foi convidado para um amigo oculto!"} />

      <section className="cartao">
        <Enfeite tipo="sino" />
        <h2>{grupo.nome}</h2>
        <DetalhesGrupo grupo={grupo} />
        {eu && (
          <div className="acoes">
            <button className="botao-texto" onClick={sair}>
              Sair (não sou {eu.nome})
            </button>
          </div>
        )}
      </section>

      {eu ? (
        <>
          {grupo.status === "sorteado" ? (
            <section className="cartao dourado">
              <Enfeite tipo="meia" atraso={-0.8} />
              <h2>Seu amigo secreto</h2>
              <Presente grupoId={id} jaVisualizou={eu.visualizou} />
            </section>
          ) : (
            <section className="cartao dourado">
              <Enfeite tipo="ampulheta" atraso={-0.8} />
              <h2>O Noel ainda está sorteando...</h2>
              <p>
                O organizador ainda não fez o sorteio. Enquanto isso, capriche na sua lista de desejos aqui embaixo!
                Quando o sorteio acontecer, volte nesta página e entre com seu nome e senha.
              </p>
            </section>
          )}

          <section className="cartao verde">
            <Enfeite tipo="pergaminho" atraso={-1.5} />
            <h2>Minha lista de desejos</h2>
            <AvisoSigilo>Só a pessoa que tirar você vai conseguir ver esta lista.</AvisoSigilo>
            <ListaDesejosEditor grupoId={id} inicial={eu.listaDesejos} />
          </section>
        </>
      ) : (
        <Acesso grupo={grupo} aoEntrar={carregar} />
      )}

      <section className="cartao verde">
        <Enfeite tipo="bola" cor="verde" atraso={-2.2} />
        <h2>Quem está participando</h2>
        {grupo.participantes.length === 0 ? (
          <p className="texto-suave">Ninguém se cadastrou ainda. Seja o primeiro!</p>
        ) : (
          <ul className="nomes">
            {grupo.participantes.map((p, i) => (
              <li key={p.nome} style={{ "--i": i } as React.CSSProperties}>
                <Avatar nome={p.nome} /> {p.nome}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Acesso({ grupo, aoEntrar }: { grupo: InfoGrupo; aoEntrar: () => void }) {
  const [aba, setAba] = useState<"entrar" | "cadastrar">(grupo.cadastroAberto ? "cadastrar" : "entrar");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (aba === "cadastrar" && senha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }
    setEnviando(true);
    try {
      await api(`/api/grupos/${grupo.id}/${aba === "cadastrar" ? "cadastro" : "login"}`, {
        metodo: "POST",
        corpo: { nome, senha },
      });
      aoEntrar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="cartao">
      <Enfeite tipo="bola" cor={aba === "cadastrar" ? "dourado" : "azul"} atraso={-1.2} />
      <h2 className="com-icone">
        <IconeGorro tamanho={34} /> {aba === "cadastrar" ? "Quero participar!" : "Já participo"}
      </h2>
      <div className="abas" role="tablist" data-aba={aba}>
        <button
          type="button"
          role="tab"
          aria-selected={aba === "cadastrar"}
          className={aba === "cadastrar" ? "ativa" : ""}
          onClick={() => {
            setAba("cadastrar");
            setErro("");
          }}
        >
          <IconeArvore tamanho={20} /> Participar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === "entrar"}
          className={aba === "entrar" ? "ativa" : ""}
          onClick={() => {
            setAba("entrar");
            setErro("");
          }}
        >
          <IconeChave tamanho={20} /> Entrar
        </button>
      </div>

      {aba === "cadastrar" && !grupo.cadastroAberto ? (
        <Aviso tipo="info">
          {grupo.status === "sorteado"
            ? "O sorteio já foi feito, então não dá mais para entrar. Fale com o organizador."
            : "O prazo de cadastro terminou. Fale com o organizador."}
        </Aviso>
      ) : (
        <form key={aba} className="formulario troca-aba" onSubmit={enviar}>
          <label className="campo">
            <span>Seu nome</span>
            <input
              required
              minLength={2}
              maxLength={40}
              autoComplete="username"
              placeholder="Como seus amigos te conhecem"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </label>
          <label className="campo">
            <span>{aba === "cadastrar" ? "Crie uma senha" : "Sua senha"}</span>
            <CampoSenha
              required
              minLength={4}
              maxLength={100}
              autoComplete={aba === "cadastrar" ? "new-password" : "current-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            {aba === "cadastrar" && <small>Mínimo de 4 caracteres. Não use a mesma senha de outros sites.</small>}
          </label>
          {aba === "cadastrar" && (
            <label className="campo">
              <span>Repita a senha</span>
              <CampoSenha
                required
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
              />
            </label>
          )}
          {aba === "cadastrar" && (
            <Aviso tipo="info">
              <strong>Guarde bem essa senha!</strong> Só com ela dá para ver quem você tirou. Ninguém consegue
              recuperá-la. Se esquecer, o organizador terá que refazer o sorteio.
            </Aviso>
          )}
          <Aviso tipo="erro">{erro}</Aviso>
          <button className="botao largo brilho" disabled={enviando}>
            {enviando ? (
              <>
                <Floco tamanho={20} className="girando" /> Embrulhando...
              </>
            ) : aba === "cadastrar" ? (
              <>
                <IconePresente tamanho={22} /> Entrar na brincadeira
              </>
            ) : (
              <>
                <IconeChave tamanho={22} /> Entrar
              </>
            )}
          </button>
        </form>
      )}
    </section>
  );
}
