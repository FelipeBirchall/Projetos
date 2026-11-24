# 🛷 Trenó Secreto

Amigo oculto de Natal em que **ninguém consegue ver quem tirou quem**: nem os participantes, nem o organizador, nem quem abrir os arquivos do servidor.

## Como rodar

Requer Node.js 20 ou superior.

```powershell
npm install
npm run dev
```

Abra http://localhost:3000.

Em produção:

```powershell
npm run build
npm start
```

Os dados ficam em `data/grupos/<id>.json` (pasta ignorada pelo git). Para mudar o local, defina a variável `DATA_DIR`.

> ⚠️ Como os dados ficam em arquivo, hospede em um servidor com disco persistente (uma VPS ou o seu próprio PC). Na Vercel e em serviços parecidos o disco é apagado a cada deploy, e os grupos se perderiam.

## Testes

```powershell
npm test
```

São 61 testes automatizados (Vitest), divididos em quatro arquivos dentro de `testes/`:

- `sorteio.test.ts`: ninguém tira a si mesmo, o sorteio forma um ciclo único, casais nunca se tiram, sorteios impossíveis são detectados e não há viés estatístico.
- `cripto.test.ts`: só a senha certa abre o resultado, um participante não abre o de outro e nada fica em texto puro.
- `regras.test.ts`: todas as regras de negócio (RN01–RN21), incluindo prazo, bloqueio por tentativas, fluxo de senha esquecida, cadastros simultâneos e a verificação de que o JSON não revela os pares.
- `api.test.ts`: as rotas HTTP com cookies reais, cobrindo cookie adulterado, expirado ou de outro grupo, token de organizador errado, logout e respostas sem vazamentos.

Os testes usam uma pasta temporária e nunca mexem em `data/`.

## Como funciona o sigilo

1. Cada participante se cadastra com uma senha que só ele conhece.
2. A senha gera um par de chaves RSA. O JSON guarda a **chave pública** e a **chave privada cifrada com a senha**.
3. No sorteio, o amigo secreto de cada pessoa é cifrado com a chave pública dela. O resultado em texto puro nunca é gravado.
4. Para ver o resultado, a pessoa entra com a senha, que destrava a própria chave privada. Assim só o **seu** amigo é revelado.
5. O cookie de sessão guarda a chave derivada da senha, lacrada com AES-GCM e um segredo do servidor (`SESSION_SECRET` ou o arquivo `data/.segredo-sessao`, gerado automaticamente).

## Regras de negócio

| Regra | Descrição |
| --- | --- |
| RN01–RN03 | O organizador cria o grupo e recebe dois links: um convite (público) e um de organizador (secreto, com o token depois do `#`). |
| RN02 / RN21 | O organizador vê só o status ("já viu o presente?"), nunca os pares. |
| RN04 / RN05 | Cada pessoa se cadastra sozinha. Nomes duplicados não são aceitos (sem diferenciar maiúsculas nem acentos). |
| RN06 | Depois do sorteio ninguém entra nem sai. Para mudar, é preciso reabrir as inscrições, o que cancela o sorteio. |
| RN07 | Mínimo de 3 participantes. |
| RN08 / RN09 | Ninguém tira a si mesmo, e o sorteio forma um único ciclo (A→B→C→…→A). |
| RN10 | Casais cadastrados pelo organizador não se tiram (nos dois sentidos). |
| RN11 / RN12 | O sorteio usa `crypto.randomInt` e o resultado em claro não é guardado. |
| RN16 / RN17 | Nenhuma rota lista pares. Os nomes aparecem sempre em ordem alfabética. |
| RN18 | 5 senhas erradas bloqueiam o acesso por 15 minutos. |
| RN19 | Senha esquecida não tem recuperação. O organizador reabre, remove a pessoa, ela se cadastra de novo e o sorteio é refeito. |
| RN20 | A lista de desejos só aparece para quem tirou a pessoa. |
