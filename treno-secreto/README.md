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

## Onde os dados ficam

O site escolhe o armazenamento automaticamente:

| Ambiente | Armazenamento |
| --- | --- |
| Seu PC / testes | Um arquivo JSON por grupo em `data/grupos/` (pasta ignorada pelo git; mude com `DATA_DIR`). |
| Vercel | Upstash Redis: o mesmo JSON de cada grupo, guardado como um registro. Ele é apagado sozinho 90 dias depois da data da troca. |

Nos dois casos, as gravações usam controle de versão: se duas pessoas alteram o mesmo grupo ao mesmo tempo (mesmo em servidores diferentes), uma delas relê e tenta de novo, sem perder nada.

## Publicar na Vercel

1. Em [vercel.com](https://vercel.com), crie um projeto importando este repositório do GitHub.
2. Em **Root Directory**, escolha `treno-secreto`. O framework (Next.js) é detectado sozinho.
3. Na aba **Storage** do projeto, crie um banco **Upstash Redis** (o plano gratuito basta) e conecte ao projeto. Isso cria as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`).
4. Faça um novo deploy (**Deployments → Redeploy**) para o site enxergar as variáveis.
5. *(Opcional)* Crie a variável `SESSION_SECRET` com um texto aleatório longo. Sem ela, o segredo da sessão é derivado do token do Upstash.

Sem o Upstash conectado, o site avisa "Armazenamento não configurado" em vez de gravar em disco temporário e perder dados.

> Trocar o `SESSION_SECRET` ou o token do Upstash só desconecta quem estiver logado. Os grupos e os sorteios continuam intactos.

## Testes

```powershell
npm test
```

São 73 testes automatizados (Vitest), divididos em cinco arquivos dentro de `testes/`:

- `sorteio.test.ts`: ninguém tira a si mesmo, o sorteio forma um ciclo único, casais nunca se tiram, sorteios impossíveis são detectados e não há viés estatístico.
- `cripto.test.ts`: só a senha certa abre o resultado, um participante não abre o de outro e nada fica em texto puro.
- `regras.test.ts`: todas as regras de negócio (RN01–RN21), incluindo prazo, bloqueio por tentativas, fluxo de senha esquecida, cadastros simultâneos e a verificação de que o JSON não revela os pares.
- `api.test.ts`: as rotas HTTP com cookies reais, cobrindo cookie adulterado, expirado ou de outro grupo, token de organizador errado, logout e respostas sem vazamentos.
- `armazenamento.test.ts`: o modo Redis da Vercel usando o cliente Upstash real contra um servidor simulado (`upstash-falso.ts`), que executa o script Lua de gravação de verdade (via fengari) e força gravações simultâneas.

Os testes usam uma pasta temporária e nunca mexem em `data/`.

## Como funciona o sigilo

1. Cada participante se cadastra com uma senha que só ele conhece.
2. A senha gera um par de chaves RSA. O JSON guarda a **chave pública** e a **chave privada cifrada com a senha**.
3. No sorteio, o amigo secreto de cada pessoa é cifrado com a chave pública dela. O resultado em texto puro nunca é gravado.
4. Para ver o resultado, a pessoa entra com a senha, que destrava a própria chave privada. Assim só o **seu** amigo é revelado.
5. O cookie de sessão guarda a chave derivada da senha, lacrada com AES-GCM e um segredo do servidor (`SESSION_SECRET`, um valor derivado do token do Upstash ou o arquivo `data/.segredo-sessao`, gerado automaticamente).

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
