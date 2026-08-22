import type { NextFunction, Request, Response } from "express";

export interface RateLimitOptions {
  /** Janela em ms. Default: 60_000 (1 minuto). */
  windowMs?: number;
  /** Máximo de requisições por chave dentro da janela. */
  max: number;
  /**
   * Função de chave. Default: req.ip.
   * Nunca use um valor vindo do body/query como chave (ex.: um userId
   * enviado pelo próprio cliente) — isso permite bypass trivial girando
   * o valor a cada request, o que já foi um achado real em outro repo.
   */
  keyFn?: (req: Request) => string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Rate limiter simples em memória (fixed window). Suficiente para um único
 * processo/instância; não compartilha estado entre réplicas. Se o serviço
 * escalar horizontalmente, troque por um backend compartilhado (Redis).
 */
export function rateLimit(options: RateLimitOptions) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max;
  const keyFn = options.keyFn ?? ((req: Request) => req.ip ?? "unknown");

  const buckets = new Map<string, Bucket>();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = keyFn(req);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({ error: "rate_limited", retryAfterSeconds: retryAfterSec });
      return;
    }

    bucket.count += 1;
    next();
  };
}
