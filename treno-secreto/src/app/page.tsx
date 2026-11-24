"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso, AvisoSigilo, Cabecalho, LinkCopiavel } from "@/components/Comuns";
import { BolaNumerada, Enfeite, Floco, IconeChave, IconeEstrela, IconeGorro, IconePresente } from "@/components/Icones";
import {
  api,
  CHAVE_GRUPOS_SALVOS,
  lerGruposSalvos,
  useGruposSalvos,
  useOrigem,
  type GrupoSalvo,
} from "@/lib/cliente";

export default function Inicio() {
  const [nome, setNome] = useState("");
  const [dataTroca, setDataTroca] = useState("");
  const [valorSugerido, setValorSugerido] = useState("");
  const [prazoCadastro, setPrazoCadastro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [criado, setCriado] = useState<GrupoSalvo | null>(null);
  const salvos = useGruposSalvos();
  const origem = useOrigem();

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const r = await api<{ id: string; adminToken: string }>("/api/grupos", {
        metodo: "POST",
        corpo: { nome, dataTroca, valorSugerido, prazoCadastro },
      });
      const novo = { id: r.id, nome, token: r.adminToken };
      const lista = [novo, ...lerGruposSalvos()];
      localStorage.setItem(CHAVE_GRUPOS_SALVOS, JSON.stringify(lista));
      setCriado(novo);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (criado) {
    const convite = `${origem}/g/${criado.id}`;
    const admin = `${origem}/g/${criado.id}/admin#${criado.token}`;
    return (
      <>
        <Cabecalho subtitulo="Ho ho ho! Seu grupo está pronto." />
        <section className="cartao verde">
          <Enfeite tipo="estrela" />
          <h2>{criado.nome}</h2>
          <p className="texto-suave">Guarde estes dois links. Eles são diferentes!</p>

          <LinkCopiavel
            icone={<IconePresente tamanho={20} />}
            rotulo="Link de convite (mande no grupo dos amigos)"
            valor={convite}
            dica="Cada pessoa entra por aqui e cria a própria senha."
          />
          <LinkCopiavel
            icone={<IconeChave tamanho={20} />}
            rotulo="Seu link de organizador (NÃO compartilhe)"
            valor={admin}
            dica="Serve para cadastrar casais e fazer o sorteio. Ele não mostra quem tirou quem."
          />

          <Aviso tipo="info">
            Se você também vai participar, entre pelo <strong>link de convite</strong> e se cadastre como todo mundo.
            O link de organizador não dá nenhuma vantagem no sorteio.
          </Aviso>

          <div className="acoes">
            <Link className="botao brilho" href={`/g/${criado.id}/admin#${criado.token}`}>
              <IconeChave tamanho={20} /> Abrir painel do organizador
            </Link>
            <Link className="botao contorno" href={`/g/${criado.id}`}>
              <IconePresente tamanho={20} /> Ir para o convite
            </Link>
          </div>
        </section>
      </>
    );
  }

  const passos = [
    "Você cria o grupo e manda o link de convite para os amigos.",
    "Cada pessoa se cadastra com uma senha que só ela sabe e monta sua lista de desejos.",
    "Você marca os casais (eles não se tiram) e faz o sorteio.",
    "Cada um entra com a própria senha e abre o presente: aparece só quem ela tirou, junto com a lista de desejos dessa pessoa.",
  ];

  return (
    <>
      <Cabecalho subtitulo="O amigo oculto onde nem o Papai Noel sabe quem tirou quem." />

      <section className="cartao">
        <Enfeite tipo="bola" cor="vermelho" />
        <h2>Criar um amigo oculto</h2>
        <p className="texto-suave">Você será o organizador. Leva menos de um minuto.</p>

        <form className="formulario" onSubmit={criar}>
          <label className="campo">
            <span>Nome do grupo</span>
            <input
              required
              maxLength={60}
              placeholder="Ex.: Amigo Oculto da Turma 2026"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </label>
          <div className="linha">
            <label className="campo">
              <span>Data da troca de presentes</span>
              <input type="date" required value={dataTroca} onChange={(e) => setDataTroca(e.target.value)} />
            </label>
            <label className="campo">
              <span>Valor sugerido</span>
              <input
                maxLength={30}
                placeholder="Ex.: R$ 100"
                value={valorSugerido}
                onChange={(e) => setValorSugerido(e.target.value)}
              />
            </label>
          </div>
          <label className="campo">
            <span>Data limite para se cadastrar (opcional)</span>
            <input
              type="date"
              value={prazoCadastro}
              max={dataTroca || undefined}
              onChange={(e) => setPrazoCadastro(e.target.value)}
            />
          </label>
          <Aviso tipo="erro">{erro}</Aviso>
          <button className="botao largo brilho" disabled={enviando}>
            {enviando ? (
              <>
                <Floco tamanho={20} className="girando" /> Preparando o trenó...
              </>
            ) : (
              <>
                <IconeGorro tamanho={24} /> Criar grupo
              </>
            )}
          </button>
        </form>
      </section>

      {salvos.length > 0 && (
        <section className="cartao dourado">
          <Enfeite tipo="sino" atraso={-1} />
          <h2>Grupos que você organiza</h2>
          <ul className="casais">
            {salvos.map((g) => (
              <li key={g.id}>
                <span className="casal">
                  <IconeEstrela tamanho={20} /> {g.nome}
                </span>
                <Link className="botao pequeno verde" href={`/g/${g.id}/admin#${g.token}`}>
                  Painel
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cartao verde">
        <Enfeite tipo="bengala" atraso={-2} />
        <h2>Como funciona</h2>
        <ol className="passos">
          {passos.map((texto, i) => (
            <li key={i} style={{ "--i": i } as React.CSSProperties}>
              <BolaNumerada numero={i + 1} />
              <span>{texto}</span>
            </li>
          ))}
        </ol>
        <AvisoSigilo>
          O resultado é guardado criptografado com a senha de cada participante. Nem o organizador, nem quem tem acesso
          ao servidor consegue ver quem tirou quem.
        </AvisoSigilo>
      </section>
    </>
  );
}
