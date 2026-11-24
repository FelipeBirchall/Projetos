import { useId } from "react";

/** Ilustrações natalinas desenhadas à mão em SVG (substituem os emojis). */

type P = { tamanho?: number; className?: string };

function Svg({ tamanho = 20, className, children, viewBox = "0 0 24 24" }: P & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={viewBox}
      className={`icone ${className ?? ""}`}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconeGorro(p: P) {
  return (
    <Svg {...p}>
      <path d="M3.5 17.5C4.5 10 8.5 5 14 5c3.5 0 5.6 2.4 6 6.2l-2.3.6c-.4-2-1.6-3.3-3.4-3.3-3.2 0-5.4 3.6-6.1 9z" fill="#E0273F" />
      <path d="M8 16c.8-4.5 3-7.6 6-8.4" stroke="#B5172D" strokeWidth="1" fill="none" opacity=".6" />
      <rect x="2" y="16.3" width="15.5" height="4.8" rx="2.4" fill="#fff" stroke="#D9CCB8" strokeWidth=".8" />
      <circle cx="19.3" cy="12.6" r="2.7" fill="#fff" stroke="#D9CCB8" strokeWidth=".8" />
    </Svg>
  );
}

export function IconePresente(p: P) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="10.5" width="17" height="10.5" rx="1.5" fill="#E0273F" />
      <rect x="2.5" y="7.5" width="19" height="4.2" rx="1.2" fill="#F0394F" />
      <rect x="10.6" y="7.5" width="2.8" height="13.5" fill="#F4C443" />
      <path
        d="M12 7.6C10.4 4.4 6.8 3.8 6.4 5.8 6 7.6 9.5 7.9 12 7.6zm0 0c1.6-3.2 5.2-3.8 5.6-1.8.4 1.8-3.1 2.1-5.6 1.8z"
        fill="#F4C443"
        stroke="#D9A21E"
        strokeWidth=".6"
      />
      <rect x="3.5" y="18.5" width="17" height="2.5" rx="1" fill="#000" opacity=".12" />
    </Svg>
  );
}

export function IconeChave(p: P) {
  return (
    <Svg {...p}>
      <circle cx="7.5" cy="12" r="4.3" fill="none" stroke="#F4C443" strokeWidth="2.6" />
      <path d="M11.8 12H21m-3 0v3.2m-2.7-3.2v2.2" stroke="#F4C443" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <circle cx="7.5" cy="12" r="1.2" fill="#D9A21E" />
    </Svg>
  );
}

export function IconeCalendario(p: P) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="16" rx="3" fill="#fff" stroke="#E7D3B5" />
      <path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2H3z" fill="#E0273F" />
      <rect x="7" y="3" width="2" height="4.4" rx="1" fill="#7A5A3A" />
      <rect x="15" y="3" width="2" height="4.4" rx="1" fill="#7A5A3A" />
      <path d="M12 13.2c-1.6-1.4-3.6-.6-3.4.8.9.2 2.2.1 3.4-.8zm0 0c1.6-1.4 3.6-.6 3.4.8-.9.2-2.2.1-3.4-.8z" fill="#1E7A42" />
      <circle cx="11.2" cy="15.6" r="1.25" fill="#E0273F" />
      <circle cx="12.8" cy="15.6" r="1.25" fill="#E0273F" />
      <circle cx="12" cy="17" r="1.25" fill="#F0394F" />
    </Svg>
  );
}

export function IconeSaco(p: P) {
  return (
    <Svg {...p}>
      <path d="M8 8.5h8l1 1.5c3 2.5 4 5.5 3 8.5-.8 2.2-3 2.8-8 2.8s-7.2-.6-8-2.8c-1-3 0-6 3-8.5z" fill="#C98A3E" />
      <path d="M8.5 8.5 7 4.5c2 .8 3.3.8 5 0 1.7.8 3 .8 5 0l-1.5 4z" fill="#B47530" />
      <rect x="7.6" y="7.6" width="8.8" height="1.9" rx=".95" fill="#E0273F" />
      <circle cx="12" cy="15.2" r="3.4" fill="#F4C443" stroke="#D9A21E" strokeWidth=".7" />
      <path d="M12 13.2v4" stroke="#A86B1F" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

export function IconeAmpulheta(p: P) {
  return (
    <Svg {...p}>
      <path d="M6 3h12M6 21h12" stroke="#7A5A3A" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 3.5c0 4 5 5.5 5 8.5s-5 4.5-5 8.5h10c0-4-5-5.5-5-8.5s5-4.5 5-8.5z" fill="#E6F2FF" stroke="#9BB7D4" />
      <path d="M9 6.5h6c-.6 1.6-3 2.8-3 2.8S9.6 8.1 9 6.5z" fill="#F4C443" className="areia-cima" />
      <path d="M9.4 19.6c.6-1.8 2.6-2.7 2.6-2.7s2 .9 2.6 2.7z" fill="#F4C443" />
    </Svg>
  );
}

export function IconeCheck(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill="#1E7A42" />
      <path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconeCadeado(p: P) {
  return (
    <Svg {...p}>
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#A7B3BF" strokeWidth="2.4" />
      <rect x="5" y="10.5" width="14" height="10.5" rx="2.5" fill="#F4C443" />
      <rect x="5" y="10.5" width="14" height="3" rx="1.5" fill="#fff" opacity=".35" />
      <circle cx="12" cy="15.2" r="1.6" fill="#8A5A12" />
      <rect x="11.3" y="15.2" width="1.4" height="3" rx=".7" fill="#8A5A12" />
    </Svg>
  );
}

export function IconeVisco(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 9V2.5" stroke="#7A5A3A" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 9C9 4 4 3 2.5 5.5 4 9 8 10.5 12 9z" fill="#2E9B5F" />
      <path d="M12 9c3-5 8-6 9.5-3.5C20 9 16 10.5 12 9z" fill="#1E7A42" />
      <path d="M12 9c-1.5 3.5-4 6-7.5 7 0-3 2.5-6 7.5-7z" fill="#24874F" />
      <path d="M12 9c1.5 3.5 4 6 7.5 7 0-3-2.5-6-7.5-7z" fill="#2E9B5F" />
      <circle cx="10.4" cy="11.6" r="1.9" fill="#fff" stroke="#E2E8EE" strokeWidth=".5" />
      <circle cx="13.6" cy="11.6" r="1.9" fill="#fff" stroke="#E2E8EE" strokeWidth=".5" />
      <circle cx="12" cy="13.8" r="1.9" fill="#fff" stroke="#E2E8EE" strokeWidth=".5" />
      <path d="M9.5 18.5c1-1.6 2.5-1.6 2.5 0 0-1.6 1.5-1.6 2.5 0-.6 1.2-2.5 2.5-2.5 2.5s-1.9-1.3-2.5-2.5z" fill="#E0273F" />
    </Svg>
  );
}

export function IconeGirar(p: P) {
  return (
    <Svg {...p}>
      <path d="M19 8.5a8 8 0 1 0 1 5.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 3.5v5h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconeOlhoFechado(p: P) {
  return (
    <Svg {...p}>
      <path
        d="M3 10c2.5 3.5 5.5 5 9 5s6.5-1.5 9-5M6 13.2 4.5 15.5M10 14.8l-.6 2.6M14 14.8l.6 2.6M18 13.2l1.5 2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconeEstrela(p: P) {
  return (
    <Svg {...p}>
      <path
        d="m12 2.5 2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z"
        fill="#F4C443"
        stroke="#E0A91F"
        strokeLinejoin="round"
      />
      <path d="m12 5.5 1.6 3.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
    </Svg>
  );
}

export function IconeArvore(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 3.5 6.5 10h3L5 15.5h3.5L4 21h16l-4.5-5.5H19L14.5 10h3z" fill="#1E7A42" />
      <path d="M12 3.5 9.5 10h3L9 15.5h3.5L9.5 21H4l4.5-5.5H5L9.5 10h-3z" fill="#24874F" />
      <rect x="10.8" y="20.6" width="2.4" height="2.6" rx=".5" fill="#7A4A24" />
      <circle cx="9.6" cy="13" r="1" fill="#F4C443" className="pisca" />
      <circle cx="14.2" cy="17.4" r="1" fill="#E0273F" className="pisca d1" />
      <circle cx="13.6" cy="11.2" r="1" fill="#4DABFF" className="pisca d2" />
      <circle cx="8.8" cy="18.6" r="1" fill="#F4C443" className="pisca d3" />
      <path d="m12 .6.8 1.6 1.7.2-1.3 1.2.3 1.7L12 4.5l-1.5.8.3-1.7-1.3-1.2 1.7-.2z" fill="#F4C443" />
    </Svg>
  );
}

export function IconeSino(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 4.5c-3.8 0-6 3-6 7v3.5l-2 3h16l-2-3v-3.5c0-4-2.2-7-6-7z" fill="#F4C443" stroke="#D9A21E" />
      <path d="M8.5 9c.5-1.6 1.6-2.6 3-2.9" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".7" fill="none" />
      <circle cx="12" cy="19.6" r="2" fill="#D9A21E" />
      <path d="M12 4.5c-1.8-2.2-4.2-2-4.2-.6 0 1.1 2.4 1.2 4.2.6zm0 0c1.8-2.2 4.2-2 4.2-.6 0 1.1-2.4 1.2-4.2.6z" fill="#E0273F" />
    </Svg>
  );
}

export function IconePergaminho(p: P) {
  return (
    <Svg {...p}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" fill="#FFF3D6" stroke="#D9B67A" />
      <path d="M8 8h8M8 11h8M8 14h5" stroke="#C9A36A" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16" cy="17.5" r="2.6" fill="#E0273F" />
      <path d="M15 17.5h2" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
    </Svg>
  );
}

export function IconeTreno(p: P) {
  return (
    <Svg {...p} viewBox="0 0 48 32">
      <path d="M8 8h22c3 0 5 2 5 5v6H10c-2 0-3-1-3-3z" fill="#E0273F" />
      <path d="M8 8h22c3 0 5 2 5 5v1.5H9C7.8 14.5 7 13.6 7 12.4z" fill="#F0394F" />
      <path d="M12 12c2-.8 4-.8 6 0" stroke="#F4C443" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M4 25h32c4 0 6-2 6.5-5" stroke="#F4C443" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M14 19v6M30 19v6" stroke="#F4C443" strokeWidth="2.2" />
      <rect x="18" y="2" width="10" height="7" rx="1.5" fill="#1E7A42" />
      <rect x="22" y="2" width="2" height="7" fill="#F4C443" />
    </Svg>
  );
}

export function Floco({ tamanho = 20, className }: P) {
  return (
    <Svg tamanho={tamanho} className={className}>
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <g key={a} transform={`rotate(${a} 12 12)`}>
            <path d="M12 12V2.5M12 6 9.8 3.9M12 6l2.2-2.1M12 9l-1.5-1.3M12 9l1.5-1.3" />
          </g>
        ))}
      </g>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </Svg>
  );
}

// ------------------------------------------------------------ enfeites pendurados nos cartões

export type TipoEnfeite = "bola" | "sino" | "estrela" | "bengala" | "visco" | "meia" | "ampulheta" | "pergaminho";

const CORES_BOLA: Record<string, [string, string]> = {
  vermelho: ["#FF5A6E", "#B5122B"],
  verde: ["#43C27A", "#146B37"],
  dourado: ["#FFE08A", "#C98F16"],
  azul: ["#7CC4FF", "#1F5FA8"],
};

function Bola({ cor = "vermelho" }: { cor?: string }) {
  const id = useId();
  const [claro, escuro] = CORES_BOLA[cor] ?? CORES_BOLA.vermelho;
  return (
    <svg width="44" height="52" viewBox="0 0 44 52" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="35%" cy="35%" r="70%">
          <stop offset="0" stopColor={claro} />
          <stop offset="1" stopColor={escuro} />
        </radialGradient>
      </defs>
      <rect x="17" y="4" width="10" height="7" rx="2" fill="#E8C060" stroke="#B88A1E" />
      <circle cx="22" cy="31" r="18" fill={`url(#${id})`} />
      <path d="M5 29c4-3 8 3 12 0s8 3 12 0 8 3 11 0" stroke="#fff" strokeWidth="2.2" fill="none" opacity=".8" />
      <path d="M6 36c4-2.5 8 2.5 12 0s8 2.5 12 0 7 2.5 10 0" stroke="#F4C443" strokeWidth="1.6" fill="none" opacity=".9" />
      <ellipse cx="15" cy="22" rx="4" ry="6" fill="#fff" opacity=".45" transform="rotate(30 15 22)" />
    </svg>
  );
}

function Grande({ children }: { children: React.ReactNode }) {
  return <span className="enfeite-figura">{children}</span>;
}

export function Enfeite({ tipo, cor, atraso = 0 }: { tipo: TipoEnfeite; cor?: string; atraso?: number }) {
  let figura: React.ReactNode;
  switch (tipo) {
    case "bola":
      figura = <Bola cor={cor} />;
      break;
    case "sino":
      figura = <Grande><IconeSino tamanho={46} /></Grande>;
      break;
    case "estrela":
      figura = <Grande><IconeEstrela tamanho={46} /></Grande>;
      break;
    case "visco":
      figura = <Grande><IconeVisco tamanho={48} /></Grande>;
      break;
    case "ampulheta":
      figura = <Grande><IconeAmpulheta tamanho={42} /></Grande>;
      break;
    case "pergaminho":
      figura = <Grande><IconePergaminho tamanho={44} /></Grande>;
      break;
    case "bengala":
      figura = (
        <svg width="34" height="54" viewBox="0 0 34 54" aria-hidden="true">
          <path d="M12 52V18a9 9 0 0 1 18 0v4" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M12 52V18a9 9 0 0 1 18 0v4" stroke="#E0273F" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="5 5" />
        </svg>
      );
      break;
    case "meia":
      figura = (
        <svg width="44" height="54" viewBox="0 0 44 54" aria-hidden="true">
          <path d="M12 10h17v22l7 5c3.5 2.6 1.6 9-3.6 8.4L18 43c-4.2-.8-6-4-6-8z" fill="#E0273F" />
          <path d="M12 26h17M12 32h16" stroke="#fff" strokeWidth="2" opacity=".8" />
          <path d="M27 38.5c2.5-1 6 .5 6.5 3" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="9.5" y="6" width="22" height="8" rx="4" fill="#fff" />
        </svg>
      );
      break;
  }
  return (
    <span className="enfeite" aria-hidden="true" style={{ animationDelay: `${atraso}s` }}>
      <span className="enfeite-fio" />
      {figura}
    </span>
  );
}

// ------------------------------------------------------------ selo de cera (lacre da carta)

/** Contorno irregular de cera derretida, calculado uma vez. */
const CONTORNO_CERA = (() => {
  const pontos = 40;
  let d = "";
  for (let i = 0; i < pontos; i++) {
    const a = (i / pontos) * Math.PI * 2;
    const r = 21 + 1.5 * Math.sin(i * 2.7) + 0.9 * Math.cos(i * 5.3);
    d += `${i ? "L" : "M"}${(24 + Math.cos(a) * r).toFixed(2)} ${(24 + Math.sin(a) * r).toFixed(2)}`;
  }
  return d + "Z";
})();

export function SeloCera({ tamanho = 60 }: { tamanho?: number }) {
  const id = useId();
  return (
    <svg className="selo-cera" width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}c`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#e8374f" />
          <stop offset=".6" stopColor="#b5122b" />
          <stop offset="1" stopColor="#7d0a1c" />
        </radialGradient>
      </defs>
      {/* cera escorrida */}
      <path d={CONTORNO_CERA} fill={`url(#${id}c)`} />
      {/* anel prensado pelo carimbo */}
      <circle cx="24" cy="24" r="14.5" fill="none" stroke="#7d0a1c" strokeWidth="1.6" opacity=".7" />
      <circle cx="24" cy="24.8" r="14.5" fill="none" stroke="#ff8a98" strokeWidth=".7" opacity=".45" />
      {/* floco de neve em relevo: sombra + luz */}
      <g stroke="#6e0818" strokeWidth="1.7" strokeLinecap="round" fill="none" transform="translate(0 .5)">
        {[0, 60, 120].map((a) => (
          <g key={a} transform={`rotate(${a} 24 24)`}>
            <path d="M24 14.5v19M24 18l-2.2-2.2M24 18l2.2-2.2M24 30l-2.2 2.2M24 30l2.2 2.2" />
          </g>
        ))}
      </g>
      <g stroke="#ffb3bd" strokeWidth=".8" strokeLinecap="round" fill="none" opacity=".75" transform="translate(-.4 -.5)">
        {[0, 60, 120].map((a) => (
          <g key={a} transform={`rotate(${a} 24 24)`}>
            <path d="M24 14.5v19M24 18l-2.2-2.2M24 18l2.2-2.2M24 30l-2.2 2.2M24 30l2.2 2.2" />
          </g>
        ))}
      </g>
      {/* brilho da cera */}
      <ellipse cx="15.5" cy="13.5" rx="4.5" ry="2.4" fill="#fff" opacity=".35" transform="rotate(-35 15.5 13.5)" />
    </svg>
  );
}

// ------------------------------------------------------------ bola de Natal com número

const CORES_NUMERO: [string, string, string][] = [
  ["#ff5a6e", "#b5122b", "#ffd36b"], // vermelha com detalhe dourado
  ["#43c27a", "#146b37", "#ffffff"], // verde com detalhe branco
  ["#7cc4ff", "#1f5fa8", "#ffffff"], // azul com detalhe branco
  ["#ffe08a", "#c98f16", "#e0273f"], // dourada com detalhe vermelho
  ["#c49bff", "#6b3fb5", "#ffd36b"], // roxa com detalhe dourado
];

export function BolaNumerada({ numero, tamanho = 46 }: { numero: number; tamanho?: number }) {
  const id = useId();
  const [claro, escuro, detalhe] = CORES_NUMERO[(numero - 1) % CORES_NUMERO.length];
  return (
    <svg className="bola-numero" width={tamanho} height={tamanho * 1.18} viewBox="0 0 44 52" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="35%" cy="32%" r="72%">
          <stop offset="0" stopColor={claro} />
          <stop offset="1" stopColor={escuro} />
        </radialGradient>
      </defs>
      <path d="M22 0v5" stroke="#b88a1e" strokeWidth="1.4" />
      <rect x="16.5" y="4" width="11" height="7" rx="2" fill="#e8c060" stroke="#b88a1e" />
      <circle cx="22" cy="31" r="19" fill={`url(#${id})`} />
      {/* pontinhos de brilho em volta */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <circle
          key={a}
          cx={22 + Math.cos((a * Math.PI) / 180) * 15}
          cy={31 + Math.sin((a * Math.PI) / 180) * 15}
          r="1.3"
          fill={detalhe}
          opacity=".9"
        />
      ))}
      <ellipse cx="13" cy="21" rx="3" ry="5" fill="#fff" opacity=".45" transform="rotate(32 13 21)" />
      <circle cx="22" cy="31" r="10.5" fill="#fff" stroke={detalhe} strokeWidth="1.4" />
      <text
        x="22"
        y="36.6"
        textAnchor="middle"
        fontSize="15.5"
        fontWeight="900"
        fill={escuro}
        fontFamily="var(--fonte-corpo), sans-serif"
      >
        {numero}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------ avatar em forma de bola de Natal

const PALETA_AVATAR = [
  ["#FF6B7D", "#B5122B"],
  ["#4CC985", "#146B37"],
  ["#FFD36B", "#C98F16"],
  ["#7CC4FF", "#1F5FA8"],
  ["#C49BFF", "#6B3FB5"],
  ["#FF9F68", "#C2521A"],
];

export function Avatar({ nome, tamanho = 30 }: { nome: string; tamanho?: number }) {
  let h = 2166136261; // FNV-1a: espalha melhor as cores entre nomes parecidos
  for (const c of nome) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const [claro, escuro] = PALETA_AVATAR[h % PALETA_AVATAR.length];
  return (
    <span
      className="avatar"
      style={{ width: tamanho, height: tamanho, background: `radial-gradient(circle at 35% 30%, ${claro}, ${escuro})` }}
      aria-hidden="true"
    >
      {nome.trim().charAt(0).toUpperCase()}
    </span>
  );
}
