---
type: overview
title: "botmaker-webhook-auth"
description: "Middleware Express de autenticação/rate-limit para webhooks e MCP servers expostos no Railway."
tags: [botmaker, webhook, seguranca]
updated: 2026-08-22
---

# botmaker-webhook-auth

Middleware Express compartilhado pra fechar o achado mais repetido na auditoria
de segurança do portfólio (2026-08-22): endpoints externos (webhooks,
MCP servers, callbacks) que confiavam no chamador só pela URL do Railway ser
"obscura" — sem autenticação, sem rate limit.

Cobre dois problemas por vez:

- **`bearerAuth`** — exige um token válido no header `Authorization: Bearer <token>`.
  Comparação em tempo constante (`crypto.timingSafeEqual`), suporta múltiplos
  tokens válidos simultâneos pra permitir rotação sem downtime.
- **`rateLimit`** — limitador simples em memória (fixed window), chaveado por
  `req.ip` por padrão. **Nunca chaveie por um valor vindo do body/query** (ex.:
  um `userId` que o próprio cliente envia) — foi exatamente esse padrão que
  permitiu bypass trivial no `cannale-runtime` durante a auditoria.

Não cobre (por escopo, v0.1): verificação de assinatura HMAC de provedores
externos (Mercado Pago, Pingoo) — cada provedor tem um esquema de assinatura
próprio. Fica para uma v0.2 se/quando for necessário.

## Instalação

Pacote não publicado no npm — instale via tarball HTTPS do GitHub, **não**
via `git+ssh://` nem `github:owner/repo`. Essas duas formas fazem o npm
tentar `git clone` por SSH internamente (é assim que o `npm-package-arg`
resolve deps hospedadas no GitHub, mesmo se você escrever `git+https://`) —
funciona na sua máquina se você tiver chave SSH configurada, mas quebra em
qualquer build container que não tenha (Railway, CI, etc.), com
`Permission denied (publickey)`. Achado real durante a integração deste
pacote no `pingoo-rcs-botmaker-bridge` (2026-08-22).

```bash
npm install https://github.com/BernardPrado/botmaker-webhook-auth/tarball/main
```

Por isso **`dist/` é commitado no repo** (não é gitignored) — o tarball é um
snapshot puro do conteúdo do git, sem passo de build, então se `dist/` não
estivesse ali o pacote instalaria sem o JS compilado. Sempre que editar
`src/`, rodar `npm run build` e commitar `dist/` junto.

## Uso

Pacote compilado em CommonJS (todos os repos-alvo do portfólio usam `require`,
não `"type": "module"`):

```js
const express = require("express");
const { bearerAuth, rateLimit } = require("botmaker-webhook-auth");

const app = express();

const auth = bearerAuth({ tokens: [process.env.WEBHOOK_TOKEN!] });
const limit = rateLimit({ max: 30, windowMs: 60_000 });

app.post("/webhook/algo", auth, limit, (req, res) => {
  // ...
});
```

Pra permitir rotação de token sem downtime, aceite o antigo e o novo por um
tempo:

```ts
bearerAuth({ tokens: [process.env.WEBHOOK_TOKEN_ANTIGO!, process.env.WEBHOOK_TOKEN_NOVO!] });
```

## Repos candidatos a adotar isso (da auditoria)

- `voice-agent-botmaker` — `/mcp/*`, `/process*`, `/send-boleto` (crítico: hoje sem nenhuma auth)
- `pingoo-rcs-botmaker-bridge` — `/webhook/pingoo`, `/webhook/botmaker-outbound`
- `cannale-tour` — `/carlos-audio`, `/carlos-reset`, `/trigger-intent`
- `cacau-park` — `/submit`, `/girar`, `/confirmar-desconto` (mais a validação de preço server-side, que isso não resolve)
- `cannale-loja-webview` — `/submit`, `/abandoned-cart`

`mp-pix-webhook-prevendasbrasildemos11` fica de fora dessa lista — o problema
lá é falta de verificação de assinatura HMAC do Mercado Pago, não falta de
bearer token (é um webhook de terceiro, não uma chamada interna).

## Build / test

```bash
npm install
npm run build
npm test
```
