"use client";

import Link from "next/link";
import { useState } from "react";
import { formatarData, type InfoGrupo } from "@/lib/cliente";
import {
  Floco,
  IconeAmpulheta,
  IconeCadeado,
  IconeCalendario,
  IconeCheck,
  IconeEstrela,
  IconeGorro,
  IconeSaco,
  IconeTreno,
} from "./Icones";

const TITULO = "Trenó Secreto";

export function Cabecalho({ subtitulo }: { subtitulo?: string }) {
  return (
    <header className="cabecalho">
      <h1 className="logo">
        <Link href="/" aria-label={TITULO}>
          <span className="letras" aria-hidden="true">
            {[...TITULO].map((c, i) => (
              <span key={i} className="letra" style={{ "--i": i } as React.CSSProperties}>
                {c}
              </span>
            ))}
          </span>
          <span className="icone-treno">
            <IconeTreno tamanho={64} />
          </span>
        </Link>
      </h1>
      {subtitulo && <p className="subtitulo">{subtitulo}</p>}
    </header>
  );
}

export function Carregando({ texto = "Preparando as renas..." }: { texto?: string }) {
  return (
    <div className="carregando">
      <Floco tamanho={56} />
      <p>{texto}</p>
    </div>
  );
}

const ICONE_AVISO = {
  erro: <IconeGorro tamanho={20} />,
  sucesso: <IconeCheck tamanho={20} />,
  info: <IconeEstrela tamanho={20} />,
};

export function Aviso({
  tipo,
  children,
  icone,
}: {
  tipo: "erro" | "sucesso" | "info";
  children: React.ReactNode;
  icone?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div className={`aviso ${tipo}`} role={tipo === "erro" ? "alert" : "status"}>
      {icone ?? ICONE_AVISO[tipo]}
      <div>{children}</div>
    </div>
  );
}

export function AvisoSigilo({ children }: { children: React.ReactNode }) {
  return (
    <Aviso tipo="sucesso" icone={<IconeCadeado tamanho={20} />}>
      {children}
    </Aviso>
  );
}

export function DetalhesGrupo({ grupo }: { grupo: InfoGrupo }) {
  let i = 0;
  const atraso = () => ({ "--i": i++ }) as React.CSSProperties;
  return (
    <div className="detalhes">
      <span className="etiqueta" style={atraso()}>
        <IconeCalendario tamanho={18} /> Troca: {formatarData(grupo.dataTroca)}
      </span>
      {grupo.valorSugerido && (
        <span className="etiqueta" style={atraso()}>
          <IconeSaco tamanho={18} /> {grupo.valorSugerido}
        </span>
      )}
      {grupo.prazoCadastro && grupo.status === "aberto" && (
        <span className="etiqueta" style={atraso()}>
          <IconeAmpulheta tamanho={18} /> Cadastro até {formatarData(grupo.prazoCadastro)}
        </span>
      )}
      {grupo.status === "sorteado" ? (
        <span className="etiqueta verde" style={atraso()}>
          <IconeCheck tamanho={18} /> Sorteio realizado
        </span>
      ) : (
        <span className="etiqueta vermelha" style={atraso()}>
          <IconeGorro tamanho={18} /> Aguardando sorteio
        </span>
      )}
    </div>
  );
}

export function LinkCopiavel({
  rotulo,
  icone,
  valor,
  dica,
}: {
  rotulo: string;
  icone?: React.ReactNode;
  valor: string;
  dica?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* navegador sem permissão: a pessoa copia manualmente do campo */
    }
  }
  return (
    <div className="copiar">
      <strong>
        {icone}
        {rotulo}
      </strong>
      <div className="copiar-linha">
        <input readOnly value={valor} onFocus={(e) => e.currentTarget.select()} aria-label={rotulo} />
        <button type="button" className={`botao verde pequeno ${copiado ? "copiado" : ""}`} onClick={copiar}>
          {copiado ? (
            <>
              <IconeCheck tamanho={16} /> Copiado!
            </>
          ) : (
            "Copiar"
          )}
        </button>
      </div>
      {dica && <small className="texto-suave">{dica}</small>}
    </div>
  );
}
