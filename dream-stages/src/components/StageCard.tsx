type StageCardData = {
  company: string;
  role: string;
  description: string;
  location: string;
  link: string;
  salary: string;
  status: "Inscrito" | "Andamento" | "Aceito" | "Rejeitado";
};

const statusStyles: Record<StageCardData["status"], string> = {
  Inscrito: "bg-amber-100 text-amber-900",
  Andamento: "bg-sky-100 text-sky-900",
  Aceito: "bg-emerald-100 text-emerald-900",
  Rejeitado: "bg-rose-100 text-rose-900",
};

export default function StageCard({
  company,
  role,
  description,
  location,
  link,
  salary,
  status,
}: StageCardData) {
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-white/80 bg-white/90 p-6 backdrop-blur card-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {company}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[color:var(--ink-900)]">
              {role}
            </h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusStyles[status]
            }`}
          >
            {status}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
        <dl className="space-y-2 text-sm text-slate-700">
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Endereco:</dt>
            <dd>{location}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Salario:</dt>
            <dd>{salary}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Link:</dt>
            <dd>
              <a
                href={link}
                className="text-[color:var(--leaf-500)] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Ver vaga
              </a>
            </dd>
          </div>
        </dl>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-full bg-[color:var(--leaf-500)] px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700">
          Alterar infos
        </button>
        <button className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300">
          Excluir card
        </button>
      </div>
    </article>
  );
}

export type { StageCardData };
