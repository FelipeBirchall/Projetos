<div align="center">

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />

# 🌙 DreamStages

**Gerencie suas candidaturas de estágio em um só lugar.**

*Nunca mais perca o controle de onde você se inscreveu.*

</div>

---

## 📌 Sobre o Projeto

**DreamStages** é uma aplicação web desenvolvida com **Next.js** para gerenciar vagas de estágio às quais o usuário se candidatou. Com ela, é possível acompanhar o status dos processos seletivos e organizar candidaturas realizadas em diferentes plataformas — tudo centralizado em um único lugar.

O projeto nasceu de um problema real: a confusão constante de lembrar *"em qual plataforma eu me inscrevi para o estágio X?"*. Com o DreamStages, esse gerenciamento se torna simples, visual e eficiente.

---

## ✨ Funcionalidades

- **Autenticação de usuários** — Cadastro e login para acesso personalizado
- **Criação de cards de candidatura** — Registre cada vaga com informações detalhadas:
  - 🏢 Nome da empresa
  - 📝 Descrição da vaga
  - 📍 Endereço / localização
  - 💰 Salário / bolsa-auxílio
  - 🛠️ Tecnologias requisitadas
  - 📊 Situação atual do processo seletivo
- **Edição de candidaturas** — Atualize as informações e o status conforme o processo avança
- **Exclusão de candidaturas** — Remova cards que não são mais relevantes
- **Visão geral organizada** — Todas as candidaturas em um painel único e claro

---

## 🚀 Tecnologias Utilizadas

| Tecnologia | Descrição |
|---|---|
| [Next.js](https://nextjs.org/) | Framework React para produção |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática para maior segurança |
| [Tailwind CSS](https://tailwindcss.com/) | Estilização utilitária e responsiva |

> ⚠️ *Backend / banco de dados ainda em desenvolvimento.*

---

## 🏗️ Estrutura do Projeto

```
dreamstages/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   └── layout.tsx
├── components/
│   ├── ui/
│   └── ...
├── public/
├── styles/
└── ...
```

---

## 🖥️ Como Rodar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/dreamstages.git

# Acesse o diretório do projeto
cd dreamstages

# Instale as dependências
npm install
# ou
yarn install
```

### Rodando a aplicação

```bash
npm run dev
# ou
yarn dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

---

## 📸 Screenshots

> *Em breve.*

---

## 🗺️ Roadmap

- [x] Interface do usuário (Front-end)
- [ ] Autenticação com banco de dados
- [ ] Persistência de dados (Back-end)
- [ ] Filtros e busca por candidaturas
- [ ] Notificações de acompanhamento
- [ ] Versão mobile otimizada

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma *issue* ou enviar um *pull request*.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 👨‍💻 Autor

Feito com por **[Felipe Birchal Borges](https://github.com/FelipeBirchall)**.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.