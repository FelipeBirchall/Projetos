const profileStats = [
  { label: "Inscrito", value: 4, tone: "bg-amber-100 text-amber-900" },
  { label: "Andamento", value: 2, tone: "bg-sky-100 text-sky-900" },
  { label: "Aceito", value: 1, tone: "bg-emerald-100 text-emerald-900" },
  { label: "Rejeitado", value: 1, tone: "bg-rose-100 text-rose-900" },
];

export default function PerfilPage() {
  return (
    <div className="px-6 pb-20 pt-10 sm:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 rise-in">
        <div className="grid gap-8 rounded-3xl border border-white/70 bg-white/70 p-10 backdrop-blur card-shadow lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--clay-700)]">
              Seu perfil
            </p>
            <h1 className="font-display text-4xl leading-tight text-[color:var(--ink-900)]">
              Ola, Camila. Aqui esta o resumo das suas candidaturas.
            </h1>
            <p className="text-base leading-7 text-slate-700">
              Mantenha seus dados atualizados e acompanhe quantas respostas
              chegaram em cada fase.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--sand-200)] bg-[color:var(--sand-100)] p-6">
            <div className="rounded-2xl bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Dados principais
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Nome:</span> Camila Rocha
                </p>
                <p>
                  <span className="font-semibold">Email:</span>
                  camila.rocha@email.com
                </p>
                <p>
                  <span className="font-semibold">Idade:</span> 21 anos
                </p>
              </div>
            </div>
            <button className="rounded-full bg-[color:var(--leaf-500)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700">
              Editar perfil
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {profileStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/80 bg-white/90 p-6 text-center backdrop-blur card-shadow"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {stat.label}
              </p>
              <p
                className={`mt-4 inline-flex rounded-full px-4 py-2 text-2xl font-semibold ${stat.tone}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
