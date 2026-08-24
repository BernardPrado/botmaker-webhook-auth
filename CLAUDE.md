# botmaker-webhook-auth

Middleware Express compartilhado (`bearerAuth` + `rateLimit`) pra webhooks/endpoints do ecossistema Botmaker. Ver [README.md](./README.md) pra uso e lista de repos que já adotaram.

## Regras deste projeto

- **`dist/` é commitado, não gitignored.** O pacote é instalado via tarball HTTPS puro (sem passo de build no consumidor), então sem `dist/` compilado o `require()` falha nos projetos que dependem dele. Sempre rodar `npm run build` e commitar `dist/` junto de qualquer mudança em `src/`.
- **Compilado como CommonJS**, não ESM — todos os repos-alvo do portfólio usam `require`, não `"type": "module"`.
- **Repo público de propósito** — infraestrutura genérica sem secret/PII, decisão documentada em `politica-visibilidade-repo` no vault. Público porque o `npm install` via tarball HTTPS precisa disso pra funcionar sem credencial no Railway/CI.
- `rateLimit` nunca deve ser chaveado por um valor vindo do body/query do cliente (ex.: `userId` auto-declarado) — só por `req.ip` por padrão. Foi exatamente esse padrão que permitiu bypass trivial no `cannale-runtime` durante a auditoria original.
- Não cobre verificação de assinatura HMAC de provedores externos (Mercado Pago, Pingoo) — escopo deliberado, fica pra v0.2 se precisar.
