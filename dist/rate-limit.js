"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
/**
 * Rate limiter simples em memória (fixed window). Suficiente para um único
 * processo/instância; não compartilha estado entre réplicas. Se o serviço
 * escalar horizontalmente, troque por um backend compartilhado (Redis).
 */
function rateLimit(options) {
    const windowMs = options.windowMs ?? 60_000;
    const max = options.max;
    const keyFn = options.keyFn ?? ((req) => req.ip ?? "unknown");
    const buckets = new Map();
    return function rateLimitMiddleware(req, res, next) {
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
