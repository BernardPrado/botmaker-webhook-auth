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
/**
 * Rate limiter simples em memória (fixed window). Suficiente para um único
 * processo/instância; não compartilha estado entre réplicas. Se o serviço
 * escalar horizontalmente, troque por um backend compartilhado (Redis).
 */
export declare function rateLimit(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void;
