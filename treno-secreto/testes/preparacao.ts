import { mkdtempSync } from "fs";
import os from "os";
import path from "path";

// Cada arquivo de teste usa sua própria pasta de dados temporária,
// nunca a pasta data/ real do projeto.
process.env.DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "treno-teste-"));
