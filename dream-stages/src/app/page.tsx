"use client";

import { useEffect, useMemo, useState } from "react";
import StageCard, { StageCardData } from "../components/StageCard";

const statusOptions: StageCardData["status"][] = [
  "Inscrito",
  "Andamento",
  "Aceito",
  "Rejeitado",
];

export default function Home() {
  const emptyStage = useMemo<StageCardData>(
    () => ({
      company: "",
      role: "",
      description: "",
      location: "",
      link: "",
      salary: "",
      status: "Inscrito",
    }),
    []
  );

  const [cards, setCards] = useState<StageCardData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<StageCardData>(emptyStage);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cards", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Falha ao carregar os cards.");
      }
      const data = (await response.json()) as { cards: StageCardData[] };
      setCards(data.cards);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error("Falha ao salvar o card.");
      }
      const data = (await response.json()) as { cards: StageCardData[] };
      setCards(data.cards);
      setFormData(emptyStage);
      setIsModalOpen(false);
      setError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Erro inesperado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-6 pb-20 pt-10 sm:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 rise-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            className="rounded-full bg-[color:var(--clay-500)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[color:var(--clay-700)]"
            onClick={() => setIsModalOpen(true)}
          >
            Cadastrar novo estagio
          </button>
          <button className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
            Filtrar por situacao
          </button>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl border border-white/80 bg-white/80 p-10 text-center text-sm text-slate-500">
            Carregando cards...
          </div>
        ) : (
          <section className="grid gap-6 lg:grid-cols-3">
            {cards.map((card) => (
              <StageCard key={`${card.company}-${card.role}`} {...card} />
            ))}
          </section>
        )}
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 py-10">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Novo estagio
                </p>
                <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
                  Cadastrar estagio
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                onClick={() => setIsModalOpen(false)}
              >
                Fechar
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="text-sm font-semibold text-slate-700">
                Nome da empresa
                <input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nome da empresa"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Descricao da vaga
                <input
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="Titulo ou area"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Descricao
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Resumo da vaga"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Endereco
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Rua, cidade"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
                  required
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Link da vaga
                  <input
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    placeholder="https://"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
                    required
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Salario
                  <input
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="R$ 0.000"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
                    required
                  />
                </label>
              </div>
              <label className="text-sm font-semibold text-slate-700">
                Situacao
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-full bg-[color:var(--clay-500)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[color:var(--clay-700)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Salvando..." : "Salvar estagio"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
