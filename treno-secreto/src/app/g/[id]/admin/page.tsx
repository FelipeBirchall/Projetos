"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Aviso, AvisoSigilo, Cabecalho, Carregando, DetalhesGrupo, LinkCopiavel } from "@/components/Comuns";
import { Avatar, Enfeite, Floco, IconeCheck, IconeGirar, IconeGorro, IconePresente, IconeVisco } from "@/components/Icones";
import {
  api,
  CHAVE_GRUPOS_SALVOS,
  lerGruposSalvos,
  soltarConfete,
  useGruposSalvos,
  useHash,
  useOrigem,
  type InfoGrupo,
} from "@/lib/cliente";

type Painel = {
  grupo: InfoGrupo;
  sorteadoEm: string | null;
  participantes: { id: string; nome: string; criadoEm: string; visualizou: boolean }[];
  exclusoes: [string, string][];
};

export default function PainelOrganizador() {
  const { id } = useParams<{ id: string }>();
  const [painel, setPainel] = useState<Painel | null>(null);
  const [buscaFeita, setBuscaFeita] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [casalA, setCasalA] = useState("");
  const [casalB, setCasalB] = useState("");
  const origem = useOrigem();
  const salvos = useGruposSalvos();

  // O token fica depois do "#": o navegador não envia essa parte para o servidor nem para logs.
  const hash = useHash();
  const token = hash === null ? null : hash || salvos.find((g) => g.id === id)?.token || "";

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    api<Painel>(`/api/grupos/${id}/admin`, { adminToken: token })
      .then((p) => {
        if (!ativo) return;
        setPainel(p);
        // Lembra o link neste navegador para facilitar a volta.
        const guardados = lerGruposSalvos();
        if (!guardados.some((g) => g.id === id)) {
          localStorage.setItem(
            CHAVE_GRUPOS_SALVOS,
            JSON.stringify([{ id, nome: p.grupo.nome, token }, ...guardados]),
          );
        }
      })
      .catch((e: Error) => ativo && setErro(e.message))
      .finally(() => ativo && setBuscaFeita(true));
    return () => {
      ativo = false;
    };
  }, [id, token]);

  const carregando = token === null || (token !== "" && !buscaFeita);

  async function acao(url: string, metodo: string, corpo?: unknown, mensagem?: string) {
    setOcupado(true);
    setErro("");
    setSucesso("");
    try {
      const p = await api<Painel>(`/api/grupos/${id}/admin${url}`, { metodo, corpo, adminToken: token! });
      setPainel(p);
      if (mensagem) setSucesso(mensagem);
      return true;
    } catch (e) {
      setErro((e as Error).message);
      return false;
    } finally {
      setOcupado(false);
    }
  }

  if (carregando) return <Carregando texto="Abrindo a oficina do Noel..." />;

  if (!painel) {
    return (
      <>
        <Cabecalho />
        <section className="cartao">
          <h2>Acesso negado</h2>
          <Aviso tipo="erro">
            {erro || "Este painel precisa do link completo de organizador (aquele com # no final)."}
          </Aviso>
          <div className="acoes">
            <Link className="botao contorno" href={`/g/${id}`}>
              Ir para a página do grupo
            </Link>
          </div>
        </section>
      </>
    );
  }

  const { grupo, participantes, exclusoes } = painel;
  const sorteado = grupo.status === "sorteado";
  const nomeDe = (pid: string) => participantes.find((p) => p.id === pid)?.nome ?? "?";
  const visualizaram = participantes.filter((p) => p.visualizou).length;

  function adicionarCasal(e: React.FormEvent) {
    e.preventDefault();
    acao("/exclusoes", "POST", { a: casalA, b: casalB }, "Casal adicionado! Eles não vão se tirar.");
    setCasalA("");
    setCasalB("");
  }

  function sortearAgora() {
    const texto = sorteado
      ? "Refazer o sorteio? Todo mundo vai receber um novo amigo secreto e precisará abrir o presente de novo."
      : `Fazer o sorteio com ${participantes.length} participantes? Depois disso ninguém mais entra.`;
    if (confirm(texto)) {
      acao("/sortear", "POST", undefined, "Sorteio feito! Avise a turma para entrar e abrir o presente.").then(
        (ok) => ok && soltarConfete(),
      );
    }
  }

  function reabrir() {
    if (
      confirm(
        "Reabrir as inscrições cancela o sorteio atual. Depois será preciso sortear de novo. Continuar?",
      )
    ) {
      acao("/reabrir", "POST", undefined, "Inscrições reabertas. O sorteio anterior foi descartado.");
    }
  }

  function remover(pid: string, nome: string) {
    if (confirm(`Remover ${nome} do grupo?`)) {
      acao(`/participantes/${pid}`, "DELETE", undefined, `${nome} foi removido(a).`);
    }
  }

  return (
    <>
      <Cabecalho subtitulo="Painel do organizador" />

      <section className="cartao">
        <Enfeite tipo="estrela" />
        <h2>{grupo.nome}</h2>
        <DetalhesGrupo grupo={grupo} />
        <LinkCopiavel
          icone={<IconePresente tamanho={20} />}
          rotulo="Link de convite"
          valor={`${origem}/g/${id}`}
          dica="Mande este link no grupo dos amigos."
        />
        <AvisoSigilo>
          Este painel <strong>não mostra quem tirou quem</strong>, nem pode mostrar: o resultado fica criptografado com a
          senha de cada participante.
        </AvisoSigilo>
      </section>

      <section className="cartao verde">
        <Enfeite tipo="bola" cor="verde" atraso={-1.4} />
        <h2>Participantes ({participantes.length})</h2>
        {participantes.length === 0 ? (
          <p className="texto-suave">Ninguém se cadastrou ainda. Compartilhe o link de convite!</p>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>{sorteado ? "Abriu o presente?" : "Cadastro"}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {participantes.map((p, i) => (
                <tr key={p.id} style={{ "--i": i } as React.CSSProperties}>
                  <td>
                    <strong className="pessoa">
                      <Avatar nome={p.nome} /> {p.nome}
                    </strong>
                  </td>
                  <td>
                    {sorteado ? (
                      p.visualizou ? (
                        <span className="etiqueta verde">
                          <IconeCheck tamanho={16} /> Já viu
                        </span>
                      ) : (
                        <span className="etiqueta vermelha">
                          <IconePresente tamanho={16} /> Ainda não
                        </span>
                      )
                    ) : (
                      <span className="texto-suave">{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</span>
                    )}
                  </td>
                  <td>
                    {!sorteado && (
                      <button className="botao-texto" disabled={ocupado} onClick={() => remover(p.id, p.nome)}>
                        remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {sorteado && (
          <>
            <div className="progresso" aria-hidden="true">
              <span style={{ width: `${(visualizaram / Math.max(participantes.length, 1)) * 100}%` }} />
            </div>
            <p className="texto-suave" style={{ marginTop: 8 }}>
              {visualizaram} de {participantes.length} já abriram o presente.
            </p>
          </>
        )}
      </section>

      <section className="cartao">
        <Enfeite tipo="visco" atraso={-0.6} />
        <h2>Casais</h2>
        <p className="texto-suave">Pessoas marcadas como casal nunca vão tirar uma à outra.</p>

        {exclusoes.length > 0 && (
          <ul className="casais">
            {exclusoes.map(([a, b]) => (
              <li key={`${a}-${b}`}>
                <span className="casal">
                  <Avatar nome={nomeDe(a)} /> {nomeDe(a)}
                  <IconeVisco tamanho={22} />
                  <Avatar nome={nomeDe(b)} /> {nomeDe(b)}
                </span>
                {!sorteado && (
                  <button
                    className="botao-texto"
                    disabled={ocupado}
                    onClick={() => acao("/exclusoes", "DELETE", { a, b }, "Casal removido.")}
                  >
                    remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {sorteado ? (
          <Aviso tipo="info">Para mudar os casais, reabra as inscrições (o sorteio será refeito).</Aviso>
        ) : participantes.length < 2 ? (
          <p className="texto-suave" style={{ marginTop: 10 }}>
            Assim que houver pelo menos duas pessoas cadastradas, você poderá marcar casais.
          </p>
        ) : (
          <form className="formulario" onSubmit={adicionarCasal}>
            <div className="linha">
              <select required value={casalA} onChange={(e) => setCasalA(e.target.value)} aria-label="Primeira pessoa">
                <option value="">Escolha uma pessoa</option>
                {participantes.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === casalB}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <select required value={casalB} onChange={(e) => setCasalB(e.target.value)} aria-label="Segunda pessoa">
                <option value="">Escolha o par</option>
                {participantes.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === casalA}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <button className="botao contorno" disabled={ocupado || !casalA || !casalB}>
              <IconeVisco tamanho={22} /> Adicionar casal
            </button>
          </form>
        )}
      </section>

      <section className="cartao dourado">
        <Enfeite tipo="bola" cor="dourado" atraso={-2} />
        <h2>Sorteio</h2>
        {sorteado ? (
          <p>
            Sorteio feito em {new Date(painel.sorteadoEm!).toLocaleString("pt-BR")}. Cada participante já pode entrar e
            abrir o presente.
          </p>
        ) : (
          <p>
            Quando todo mundo estiver cadastrado, faça o sorteio. São necessárias pelo menos <strong>3 pessoas</strong>.
            Depois do sorteio, ninguém mais entra no grupo.
          </p>
        )}

        <Aviso tipo="erro">{erro}</Aviso>
        <Aviso tipo="sucesso">{sucesso}</Aviso>

        <div className="acoes">
          <button
            className={`botao ${sorteado ? "" : "brilho"}`}
            disabled={ocupado || participantes.length < 3}
            onClick={sortearAgora}
          >
            {ocupado ? (
              <Floco tamanho={22} className="girando" />
            ) : sorteado ? (
              <IconeGirar tamanho={20} />
            ) : (
              <IconeGorro tamanho={24} />
            )}
            {sorteado ? "Refazer sorteio" : "Fazer o sorteio"}
          </button>
          {sorteado && (
            <button className="botao contorno" disabled={ocupado} onClick={reabrir}>
              Reabrir inscrições
            </button>
          )}
        </div>

        {sorteado && (
          <p className="texto-suave" style={{ marginTop: 14 }}>
            <strong>Alguém esqueceu a senha?</strong> Como ninguém consegue recuperar senhas, reabra as inscrições, remova a
            pessoa, peça para ela se cadastrar de novo e faça um novo sorteio.
          </p>
        )}
      </section>
    </>
  );
}
