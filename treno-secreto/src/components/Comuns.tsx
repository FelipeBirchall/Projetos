"use client";

import Link from "next/link";
import { useState } from "react";
import { faixaDeValor, formatarData, type InfoGrupo } from "@/lib/cliente";
import {
  Floco,
  IconeAmpulheta,
  SeloCera,
  IconeCalendario,
  IconeCheck,
  IconeEstrela,
  IconeGorro,
  IconeEtiquetaPreco,
  IconeOlhoAberto,
  IconeOlhoFechado,
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

/** Aviso de sigilo em forma de carta lacrada com selo de cera. */
export function AvisoSigilo({
  children,
  titulo = "Segredo bem guardado",
}: {
  children: React.ReactNode;
  titulo?: string;
}) {
  return (
    <div className="carta-lacrada" role="note">
      <SeloCera />
      <div className="carta-texto">
        <strong className="carta-titulo">{titulo}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function DetalhesGrupo({ grupo }: { grupo: InfoGrupo }) {
  let i = 0;
  const atraso = () => ({ "--i": i++ }) as React.CSSProperties;
  const faixa = faixaDeValor(grupo);
  return (
    <div className="detalhes">
      <span className="etiqueta" style={atraso()}>
        <IconeCalendario tamanho={18} /> Troca: {formatarData(grupo.dataTroca)}
      </span>
      {faixa && (
        <span className="etiqueta" style={atraso()}>
          <IconeEtiquetaPreco tamanho={18} /> {faixa}
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

/** Campo de senha com botão de olho para mostrar/ocultar o que foi digitado. */
export function CampoSenha(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visivel, setVisivel] = useState(false);
  return (
    <span className="campo-senha">
      <input {...props} type={visivel ? "text" : "password"} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <button
        type="button"
        className="mostrar-senha"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
        title={visivel ? "Ocultar senha" : "Mostrar senha"}
      >
        {visivel ? <IconeOlhoFechado tamanho={20} /> : <IconeOlhoAberto tamanho={20} />}
      </button>
    </span>
  );
}
