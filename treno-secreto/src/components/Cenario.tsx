"use client";

import { useEffect } from "react";
import { Floco } from "./Icones";

// Gerador pseudoaleatório com semente fixa: servidor e navegador desenham o mesmo céu.
function gerador(semente: number) {
  return () => {
    semente = (semente * 1664525 + 1013904223) % 4294967296;
    return semente / 4294967296;
  };
}
const r = gerador(2512);

const ESTRELAS = Array.from({ length: 70 }, () => ({
  x: r() * 100,
  y: r() * 55,
  t: 1 + r() * 2.2,
  d: r() * 5,
  dur: 2 + r() * 4,
  brilho: r() > 0.88,
}));

const NEVE_LONGE = Array.from({ length: 70 }, () => ({
  x: r() * 100,
  t: 2 + r() * 3,
  dur: 14 + r() * 14,
  d: -r() * 28,
  desvio: (r() - 0.5) * 80,
  o: 0.35 + r() * 0.4,
}));

const NEVE_PERTO = Array.from({ length: 16 }, () => ({
  x: r() * 100,
  t: 12 + r() * 14,
  dur: 10 + r() * 9,
  d: -r() * 20,
  balanco: 2.5 + r() * 3,
  giro: 6 + r() * 10,
  o: 0.55 + r() * 0.4,
}));

const CORES_LUZES = ["#ff4d5e", "#ffd23f", "#3ddc84", "#4dabff", "#ff8cd9", "#b18cff"];
const SEGMENTOS = 26;
// Uma lâmpada no ponto mais baixo de cada curva do fio.
const LAMPADAS = Array.from({ length: SEGMENTOS }, (_, i) => ({
  x: ((i + 0.5) / SEGMENTOS) * 100,
  y: 17,
  cor: CORES_LUZES[i % CORES_LUZES.length],
  i,
}));
const FIO = Array.from({ length: SEGMENTOS }, (_, s) => {
  const x0 = (s * 1200) / SEGMENTOS;
  const x1 = ((s + 1) * 1200) / SEGMENTOS;
  return `M${x0} 4 Q${(x0 + x1) / 2} 30 ${x1} 4`;
}).join(" ");

function Pinheiro({ x, y, escala = 1, luzes = false }: { x: number; y: number; escala?: number; luzes?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <rect x="-4" y="-2" width="8" height="12" fill="#5b3418" />
      <polygon points="0,-74 -24,-36 24,-36" fill="#1e6b3a" />
      <polygon points="0,-58 -31,-14 31,-14" fill="#1a5f33" />
      <polygon points="0,-40 -38,4 38,4" fill="#17542d" />
      <path d="M0 -74 -12 -55 -4 -58 0 -50 5 -58 12 -55Z" fill="#fff" opacity=".9" />
      <path d="M-31 -14 -18 -20 -10 -15 0 -22 10 -15 19 -20 31 -14Z" fill="#fff" opacity=".85" />
      <path d="M-38 4 -24 -3 -12 2 0 -5 12 2 24 -3 38 4Z" fill="#fff" opacity=".85" />
      {luzes &&
        [
          [-12, -42, "#ffd23f"],
          [10, -30, "#ff4d5e"],
          [-18, -20, "#4dabff"],
          [16, -8, "#ffd23f"],
          [-6, -6, "#3ddc84"],
          [4, -52, "#ff8cd9"],
        ].map(([lx, ly, cor], i) => (
          <circle key={i} cx={lx} cy={ly} r="2.6" fill={cor as string} className="luz-arvore" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      <path d="M0 -84 2.5 -79 8 -78.5 4 -75 5 -69.5 0 -72.3 -5 -69.5 -4 -75 -8 -78.5 -2.5 -79Z" fill="#f4c443" className="estrela-topo" />
    </g>
  );
}

/** Céu de Natal animado, com parallax suave acompanhando o mouse. */
export default function Cenario() {
  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) return;
    let quadro = 0;
    const raiz = document.documentElement;
    function mover(e: PointerEvent) {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        raiz.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        raiz.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    }
    window.addEventListener("pointermove", mover);
    return () => {
      window.removeEventListener("pointermove", mover);
      cancelAnimationFrame(quadro);
    };
  }, []);

  return (
    <div className="cenario" aria-hidden="true">
      <div className="aurora">
        <span className="aurora-1" />
        <span className="aurora-2" />
        <span className="aurora-3" />
      </div>

      <div className="camada estrelas" style={{ "--f": 6 } as React.CSSProperties}>
        {ESTRELAS.map((e, i) => (
          <span
            key={i}
            className={e.brilho ? "estrela brilhante" : "estrela"}
            style={{
              left: `${e.x}%`,
              top: `${e.y}%`,
              width: e.brilho ? 12 : e.t,
              height: e.brilho ? 12 : e.t,
              animationDelay: `${e.d}s`,
              animationDuration: `${e.dur}s`,
            }}
          />
        ))}
        <span className="estrela-cadente" />
        <span className="estrela-cadente c2" />
      </div>

      <div className="camada lua-camada" style={{ "--f": 12 } as React.CSSProperties}>
        <div className="lua">
          <span className="cratera c1" />
          <span className="cratera c2" />
          <span className="cratera c3" />
        </div>
      </div>

      <div className="treno-voo">
        <div className="treno-balanco">
          <svg viewBox="0 0 300 80" width="300" height="80">
            <g className="rastro">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <circle key={i} cx={-6 - i * 16} cy={52 + (i % 2) * 6} r={2.6 - i * 0.3} fill="#fff6c9" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </g>
            <g fill="#fff3c4" className="silhueta">
              {/* trenó */}
              <path d="M6 44h50c6 0 9-5 9-12h-5c0 4-2 6-5 6H14c-4 0-6-4-6-10H4c0 9 1 16 2 16z" />
              <path d="M0 52h58c5 0 8-3 9-7" stroke="#fff3c4" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M18 44v8M48 44v8" stroke="#fff3c4" strokeWidth="2.4" />
              {/* Noel */}
              <ellipse cx="34" cy="28" rx="10" ry="10" />
              <circle cx="38" cy="15" r="6" />
              <path d="M33 11c2-7 9-9 14-4l3 4-4 1c-2-3-5-4-7-2z" />
              <circle cx="51" cy="11.5" r="2.4" />
              {/* saco de presentes */}
              <ellipse cx="17" cy="27" rx="9" ry="10" />
              <path d="M14 18l3-5 3 5z" />
              {/* rédeas */}
              <path d="M44 26 C 90 30, 120 34, 150 36" stroke="#fff3c4" strokeWidth="1.2" fill="none" opacity=".8" />
              {/* renas */}
              {[100, 160, 220].map((x, i) => (
                <g key={x} transform={`translate(${x} ${38 - i * 3})`} className={`rena r${i}`}>
                  <ellipse cx="0" cy="0" rx="15" ry="6.5" />
                  <path d="M10 -3 18 -14 25 -13 21 -7 14 1z" />
                  <path d="M19 -14 15 -23M15 -23 11 -25M15 -23 15 -28M21 -14 25 -22M25 -22 29 -23M25 -22 24 -27" stroke="#fff3c4" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  <path className="perna-a" d="M-10 3-17 10M10 3 18 8" stroke="#fff3c4" strokeWidth="2.6" strokeLinecap="round" />
                  <path className="perna-b" d="M-6 4-9 13M7 4 9 13" stroke="#fff3c4" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M-15 -2-20 -6" stroke="#fff3c4" strokeWidth="2.4" strokeLinecap="round" />
                  {i === 2 && <circle cx="25" cy="-11" r="2.6" fill="#ff4d5e" className="nariz" />}
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>

      <svg className="cordao-luzes" viewBox="0 0 1200 40" preserveAspectRatio="none">
        <path d={FIO} stroke="#22301f" strokeWidth="2.2" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      <ul className="lampadas">
        {LAMPADAS.map((l) => (
          <li
            key={l.i}
            style={{ left: `${l.x}%`, top: l.y, "--cor": l.cor, animationDelay: `${(l.i % 12) * 0.18}s` } as React.CSSProperties}
          />
        ))}
      </ul>

      <div className="neve longe">
        {NEVE_LONGE.map((f, i) => (
          <span
            key={i}
            className="floco"
            style={
              {
                left: `${f.x}%`,
                width: f.t,
                height: f.t,
                opacity: f.o,
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.d}s`,
                "--desvio": `${f.desvio}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="camada colinas-camada fundo" style={{ "--f": 10 } as React.CSSProperties}>
        <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice">
          <path d="M0 150 C 200 90 380 160 620 110 C 860 60 1100 150 1440 95 L1440 260 L0 260Z" fill="#2c4a68" opacity=".55" />
          {[60, 120, 300, 980, 1060, 1180, 1300, 1380].map((x, i) => (
            <g key={x} transform={`translate(${x} ${120 + (i % 3) * 8}) scale(${0.45 + (i % 2) * 0.15})`} opacity=".55">
              <polygon points="0,-70 -26,-10 26,-10" fill="#1b3a54" />
              <polygon points="0,-48 -32,14 32,14" fill="#1b3a54" />
            </g>
          ))}
        </svg>
      </div>

      <div className="camada colinas-camada meio" style={{ "--f": 18 } as React.CSSProperties}>
        <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice">
          <path d="M0 180 C 240 120 420 210 720 160 C 1020 110 1200 200 1440 150 L1440 260 L0 260Z" fill="#cfdeee" />
          {/* cabana */}
          <g transform="translate(1110 150)">
            <rect x="-38" y="-30" width="76" height="40" fill="#6b3f1d" />
            <path d="M-38 -22h76M-38 -12h76M-38 -2h76" stroke="#56300f" strokeWidth="2" />
            <polygon points="-48,-28 0,-62 48,-28" fill="#8e2a2a" />
            <path d="M-50 -27 0 -64 50 -27 44 -24 0 -56 -44 -24Z" fill="#fff" />
            <rect x="18" y="-66" width="12" height="22" fill="#7a2222" />
            <rect x="16" y="-69" width="16" height="5" fill="#fff" />
            <rect x="-26" y="-20" width="18" height="16" rx="2" fill="#ffcf6b" className="janela" />
            <path d="M-17 -20v16M-26 -12h18" stroke="#6b3f1d" strokeWidth="2" />
            <rect x="6" y="-14" width="16" height="24" rx="2" fill="#4a2810" />
            <circle cx="18" cy="-1" r="1.5" fill="#f4c443" />
            <g className="fumaca">
              <circle cx="24" cy="-76" r="6" />
              <circle cx="24" cy="-76" r="6" />
              <circle cx="24" cy="-76" r="6" />
            </g>
          </g>
          <Pinheiro x={1010} y={170} escala={0.75} />
          <Pinheiro x={1225} y={165} escala={0.6} />
          <Pinheiro x={250} y={180} escala={0.6} />
        </svg>
      </div>

      <div className="camada colinas-camada frente" style={{ "--f": 28 } as React.CSSProperties}>
        <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice">
          <path d="M0 215 C 300 170 520 240 860 200 C 1120 172 1300 228 1440 205 L1440 260 L0 260Z" fill="#f4f9ff" />
          <Pinheiro x={80} y={222} escala={1.05} luzes />
          <Pinheiro x={165} y={226} escala={0.75} />
          <Pinheiro x={1340} y={214} escala={1.1} luzes />
          <Pinheiro x={1410} y={222} escala={0.7} />
          {/* boneco de neve */}
          <g transform="translate(1250 220)" className="boneco">
            <circle cx="0" cy="-8" r="16" fill="#fff" stroke="#dbe7f3" strokeWidth="2" />
            <circle cx="0" cy="-34" r="11" fill="#fff" stroke="#dbe7f3" strokeWidth="2" />
            <rect x="-9" y="-49" width="18" height="4" fill="#22303c" />
            <rect x="-6" y="-60" width="12" height="12" fill="#22303c" />
            <rect x="-6" y="-51" width="12" height="2.5" fill="#e0273f" />
            <circle cx="-4" cy="-36" r="1.4" fill="#22303c" />
            <circle cx="4" cy="-36" r="1.4" fill="#22303c" />
            <path d="M0 -33 9 -31 0 -30.5z" fill="#ff8a3d" />
            <path d="M-10 -25c6 4 14 4 20 0" stroke="#e0273f" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M6 -24l4 10" stroke="#e0273f" strokeWidth="4" strokeLinecap="round" />
            <circle cx="0" cy="-12" r="1.6" fill="#22303c" />
            <circle cx="0" cy="-4" r="1.6" fill="#22303c" />
            <path d="M-14 -16-28 -26M-28 -26-31 -31M-28 -26-33 -25" stroke="#6b3f1d" strokeWidth="2.2" strokeLinecap="round" className="braco" />
            <path d="M14 -16 28 -24" stroke="#6b3f1d" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      <div className="neve perto">
        {NEVE_PERTO.map((f, i) => (
          <span
            key={i}
            className="floco-cristal"
            style={
              {
                left: `${f.x}%`,
                opacity: f.o,
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.d}s`,
              } as React.CSSProperties
            }
          >
            <span
              className="floco-giro"
              style={{ animationDuration: `${f.balanco}s, ${f.giro}s` } as React.CSSProperties}
            >
              <Floco tamanho={f.t} />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
