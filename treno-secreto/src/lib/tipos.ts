export type Participante = {
  id: string;
  nome: string;
  criadoEm: string;
  /** scrypt(senha, saltSenha) — só para verificar a senha */
  senhaHash: string;
  saltSenha: string;
  /** salt para derivar a chave que protege a chave privada */
  saltChave: string;
  /** Chave pública RSA: qualquer um pode cifrar PARA esta pessoa */
  chavePublica: string;
  /** Chave privada RSA cifrada com uma chave derivada da senha da pessoa */
  chavePrivadaCifrada: string;
  /** id do amigo secreto, cifrado com a chave pública da pessoa (RN14) */
  amigoCifrado: string | null;
  visualizou: boolean;
  listaDesejos: string[];
  tentativasFalhas: number;
  bloqueadoAte: string | null;
};

export type StatusGrupo = "aberto" | "sorteado";

export type Grupo = {
  id: string;
  nome: string;
  dataTroca: string;
  valorSugerido: string;
  prazoCadastro: string | null;
  criadoEm: string;
  adminTokenHash: string;
  status: StatusGrupo;
  sorteadoEm: string | null;
  participantes: Participante[];
  /** Pares que não podem se tirar (casais). Vale nos dois sentidos. */
  exclusoes: [string, string][];
  /** Aumenta a cada gravação; impede que duas gravações simultâneas se sobrescrevam. */
  versao?: number;
};

export class ErroNegocio extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}
