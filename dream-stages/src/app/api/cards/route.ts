import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type StageCardData = {
  company: string;
  role: string;
  description: string;
  location: string;
  link: string;
  salary: string;
  status: "Inscrito" | "Andamento" | "Aceito" | "Rejeitado";
};

type CardStore = {
  cards: StageCardData[];
};

const dataFilePath = path.join(process.cwd(), "dados.json");

const readStore = async (): Promise<CardStore> => {
  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(raw) as CardStore;
    if (!Array.isArray(parsed.cards)) {
      return { cards: [] };
    }
    return parsed;
  } catch {
    return { cards: [] };
  }
};

const writeStore = async (store: CardStore) => {
  await fs.writeFile(dataFilePath, JSON.stringify(store, null, 2), "utf8");
};

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  const body = (await request.json()) as StageCardData;
  if (!body.company || !body.role || !body.link || !body.location) {
    return NextResponse.json(
      { message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const updated = { cards: [...store.cards, body] };
  await writeStore(updated);

  return NextResponse.json(updated);
}
