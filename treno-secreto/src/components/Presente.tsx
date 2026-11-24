"use client";

import { useState } from "react";
import { api, soltarConfete } from "@/lib/cliente";
import { Aviso } from "./Comuns";
import { IconeOlhoFechado, IconePresente } from "./Icones";

type Amigo = { nome: string; listaDesejos: string[] };

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

          <h3>Lista de desejos de {amigo.nome}</h3>
          {amigo.listaDesejos.length === 0 ? (
            <Aviso tipo="info">{amigo.nome} ainda não montou a lista de desejos. Volte aqui mais perto da troca!</Aviso>
          ) : (
            <ul className="lista-desejos">
              {amigo.listaDesejos.map((item, i) => (
                <li key={i} style={{ "--i": i + 8 } as React.CSSProperties}>
                  <IconePresente tamanho={22} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
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
