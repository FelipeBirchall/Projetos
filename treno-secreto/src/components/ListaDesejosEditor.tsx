"use client";

import { useState } from "react";
import { api } from "@/lib/cliente";
import { Aviso } from "./Comuns";
import { IconePresente } from "./Icones";

const MAX_ITENS = 15;

export default function ListaDesejosEditor({ grupoId, inicial }: { grupoId: string; inicial: string[] }) {
  const [itens, setItens] = useState<string[]>(inicial);
  const [novo, setNovo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);

  async function salvar(lista: string[]) {
    setSalvando(true);
    setMensagem(null);
    try {
      const r = await api<{ listaDesejos: string[] }>(`/api/grupos/${grupoId}/lista`, {
        metodo: "PUT",
        corpo: { itens: lista },
      });
      setItens(r.listaDesejos);
      setMensagem({ tipo: "sucesso", texto: "Lista salva! O Noel já anotou." });
    } catch (e) {
      setMensagem({ tipo: "erro", texto: (e as Error).message });
    } finally {
      setSalvando(false);
    }
  }

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const item = novo.trim();
    if (!item) return;
    setNovo("");
    salvar([...itens, item]);
  }

  function remover(i: number) {
    salvar(itens.filter((_, j) => j !== i));
  }

  return (
    <div>
      {itens.length > 0 ? (
        <ul className="lista-desejos">
          {itens.map((item, i) => (
            <li key={`${i}-${item}`} style={{ "--i": i } as React.CSSProperties}>
              <IconePresente tamanho={22} />
              <span style={{ flex: 1 }}>{item}</span>
              <button
                type="button"
                className="botao-texto"
                onClick={() => remover(i)}
                disabled={salvando}
                aria-label={`Remover ${item}`}
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="texto-suave" style={{ marginTop: 10 }}>
          Sua lista está vazia. Dê umas dicas para quem te tirar!
        </p>
      )}

      {itens.length < MAX_ITENS && (
        <form className="editor-item" onSubmit={adicionar} style={{ marginTop: 14 }}>
          <input
            maxLength={200}
            placeholder="Ex.: Livro de receitas, meia de lã tamanho 40..."
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            aria-label="Novo item da lista de desejos"
          />
          <button className="botao verde" disabled={salvando || !novo.trim()}>
            Adicionar
          </button>
        </form>
      )}
      {mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>}
    </div>
  );
}
