import Link from "next/link";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Cadastro", href: "/cadastro" },
  { label: "Login", href: "/login" },
  { label: "Perfil", href: "/perfil" },
];

export default function Header() {
  return (
    <header className="px-6 pt-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/70 p-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--clay-500)] text-sm font-semibold text-white">
            DS
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Dream Stages
            </p>
            <p className="font-display text-lg text-[color:var(--ink-900)]">
              Painel de estagios
            </p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 transition hover:bg-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
