import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export interface BearerAuthOptions {
  /** Um ou mais tokens válidos (permite rotação sem downtime: aceita o antigo e o novo por um período). */
  tokens: string[];
  /** Header a ler. Default: "authorization" (espera "Bearer <token>"). */
  header?: string;
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // ainda compara contra um buffer do mesmo tamanho de bufA pra não vazar
    // a diferença de tamanho por timing tão facilmente quanto um early-return puro.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function extractToken(rawHeader: string | undefined): string | null {
  if (!rawHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(rawHeader.trim());
  return match ? match[1] : rawHeader.trim();
}

/**
 * Middleware Express que exige um bearer token válido.
 * Nunca aceita o token vindo do body/query — só do header, pra não repetir
 * o padrão de "cid/ch no body" que permitia forjar chamadas nos webhooks auditados.
 */
export function bearerAuth(options: BearerAuthOptions) {
  const headerName = (options.header ?? "authorization").toLowerCase();
  const tokens = options.tokens.filter(Boolean);
  if (tokens.length === 0) {
    throw new Error("bearerAuth: nenhum token configurado — configure ao menos um token válido.");
  }

  return function bearerAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const provided = extractToken(req.header(headerName));
    if (!provided) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const isValid = tokens.some((t) => constantTimeEqual(provided, t));
    if (!isValid) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    next();
  };
}
