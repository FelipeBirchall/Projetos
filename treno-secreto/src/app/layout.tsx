import type { Metadata } from "next";
import { Mountains_of_Christmas, Nunito } from "next/font/google";
import Cenario from "@/components/Cenario";
import { IconeArvore } from "@/components/Icones";
import "./globals.css";

const titulo = Mountains_of_Christmas({
  variable: "--fonte-titulo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const corpo = Nunito({
  variable: "--fonte-corpo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trenó Secreto — Amigo Oculto de Natal",
  description: "Sorteie o amigo oculto com seus amigos. Ninguém descobre quem tirou quem.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable}`}>
      <body>
        <Cenario />
        <main className="conteudo">{children}</main>
        <footer className="rodape">
          Feito com <IconeArvore tamanho={18} /> e chocolate quente · Trenó Secreto
        </footer>
      </body>
    </html>
  );
}
