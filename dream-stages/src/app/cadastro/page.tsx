export default function CadastroPage() {
  return (
    <div className="px-6 pb-20 pt-10 sm:px-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 rise-in">
        <div className="grid gap-8 rounded-3xl border border-white/70 bg-white/70 p-10 backdrop-blur card-shadow lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--clay-700)]">
              Primeiro acesso
            </p>
            <h1 className="font-display text-4xl leading-tight text-[color:var(--ink-900)]">
              Crie sua conta e organize todos os seus estagios.
            </h1>
            <p className="text-base leading-7 text-slate-700">
              Informe os dados principais e comece a registrar cada vaga que
              voce se inscreveu.
            </p>
          </div>
          <form className="flex flex-col gap-4 rounded-2xl border border-[color:var(--sand-200)] bg-[color:var(--sand-100)] p-6">
            <label className="text-sm font-semibold text-slate-700">
              Nome
              <input
                type="text"
                placeholder="Seu nome completo"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                placeholder="voce@email.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Idade
              <input
                type="number"
                min="16"
                placeholder="18"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Senha
              <input
                type="password"
                placeholder="Crie uma senha segura"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[color:var(--clay-500)]"
              />
            </label>
            <button
              type="submit"
              className="mt-2 rounded-full bg-[color:var(--clay-500)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[color:var(--clay-700)]"
            >
              Criar conta
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Voltar para o login
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
