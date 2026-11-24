"use client";

import { useState } from "react";
import { api, soltarConfete } from "@/lib/cliente";
import { Aviso } from "./Comuns";
import { IconeArvore, IconeOlhoFechado } from "./Icones";

type Amigo = { nome: string; listaDesejos: string[] };

/** A lista de desejos de quem você tirou, escrita como uma cartinha ao Papai Noel. */
function CartaAoPapaiNoel({ nome, itens }: { nome: string; itens: string[] }) {
  return (
    <article className="carta-noel" aria-label={`Cartinha de ${nome} para o Papai Noel`}>
      <span className="carta-noel-selo" aria-hidden="true">
        <IconeArvore tamanho={30} />
        <small>Polo Norte</small>
      </span>
      <p className="carta-noel-saudacao">Querido Papai Noel,</p>
      {itens.length > 0 ? (
        <>
          <p>Este ano eu me comportei muito bem (quase sempre!) e queria fazer um pedido especial. Eu gostaria de ganhar de presente:</p>
          <ul className="carta-noel-lista">
            {itens.map((item, i) => (
              <li key={i} style={{ "--i": i + 8 } as React.CSSProperties}>
                {item}
              </li>
            ))}
          </ul>
          <p>Se não der para trazer tudo, qualquer um deles já vai deixar o meu Natal mais feliz!</p>
        </>
      ) : (
        <p>
          Ainda estou pensando no que pedir este ano... Prometo escrever a minha lista antes da troca de presentes!
          Enquanto isso, mando um abraço quentinho para você e para as renas.
        </p>
      )}
      <p className="carta-noel-despedida">Com carinho,</p>
      <p className="carta-noel-assinatura">{nome}</p>
    </article>
  );
}

export default function Presente({ grupoId, jaVisualizou }: { grupoId: string; jaVisualizou: boolean }) {
  const [amigo, setAmigo] = useState<Amigo | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState("");

  async function abrir() {
    if (amigo || abrindo) return;
    setAbrindo(true);
    setErro("");
    try {
      const r = await api<Amigo>(`/api/grupos/${grupoId}/revelar`, { metodo: "POST" });
      setAmigo(r);
      soltarConfete();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setAbrindo(false);
    }
  }

  return (
    <div className="area-presente">
      {!amigo && (
        <p>
          {jaVisualizou
            ? "Você já abriu seu presente antes. Clique de novo para relembrar."
            : "Confira se ninguém está espiando sua tela e clique no presente!"}
        </p>
      )}

      <div className={`palco-presente ${amigo ? "aberto" : ""}`}>
        <span className="raios" />
        {!amigo && (
          <span className="brilhos" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
        )}
        <button
          type="button"
          className={`presente ${amigo ? "aberto" : ""}`}
          onClick={abrir}
          disabled={abrindo}
          aria-label="Abrir presente e ver meu amigo secreto"
        >
          <span className="caixa" />
          <span className="tampa">
            <span className="laco" />
            <span className="no" />
          </span>
        </button>
      </div>

      <Aviso tipo="erro">{erro}</Aviso>

      {amigo && (
        <div className="revelacao">
          <p className="texto-suave">Você tirou...</p>
          <p className="nome-amigo" aria-label={amigo.nome}>
            {[...amigo.nome].map((c, i) => (
              <span key={i} style={{ "--i": i } as React.CSSProperties} aria-hidden="true">
                {c === " " ? " " : c}
              </span>
            ))}
          </p>
          <p className="texto-suave">Shhh! Não conte pra ninguém.</p>

          <CartaAoPapaiNoel nome={amigo.nome} itens={amigo.listaDesejos} />
          <div className="acoes" style={{ justifyContent: "center" }}>
            <button className="botao contorno pequeno" onClick={() => setAmigo(null)}>
              <IconeOlhoFechado tamanho={18} /> Esconder de novo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
