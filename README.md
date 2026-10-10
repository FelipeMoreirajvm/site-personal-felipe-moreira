# Site Felipe Moreira

Portfólio pessoal de Felipe Moreira, acadêmico de Engenharia de Software. É uma página única com apresentação, foto e links para as redes sociais.

## Tecnologias

- [Astro](https://astro.build): geração do site estático
- TypeScript, HTML e CSS
- Fontes Bricolage Grotesque e Manrope, instaladas via [Fontsource](https://fontsource.org)
- Node.js e npm

## Como rodar no computador

Pré-requisito: [Node.js](https://nodejs.org) (versão LTS).

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:4321`).

Para gerar a versão final do site:

```bash
npm run build
```

## Como editar o conteúdo

Nome, profissão, texto de apresentação e redes sociais ficam em `src/data/profile.json`. O **primeiro** link de `socialLinks` vira o botão principal, destacado em dourado.

Os links precisam começar com `https://`. Links em outro formato são descartados por segurança.

A foto fica em `src/assets/`, e o arquivo usado é definido em `src/lib/getProfile.ts`.

## Estrutura

```
src/
├── assets/        foto de perfil
├── components/    Hero.astro e SocialLinks.astro
├── data/          profile.json (conteúdo do site)
├── layouts/       BaseLayout.astro (estrutura HTML comum)
├── lib/           getProfile.ts (único ponto que lê os dados)
├── pages/         index.astro (página inicial)
└── styles/        global.css e animations.css
```

## Status

- [x] Página inicial com foto, apresentação e botões das redes sociais
- [x] Animações leves, com respeito à preferência de "reduzir movimento"
- [ ] Painel de edição com login (Sanity)
- [ ] Publicação online
