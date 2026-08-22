import type { NextFunction, Request, Response } from "express";
export interface BearerAuthOptions {
    /** Um ou mais tokens válidos (permite rotação sem downtime: aceita o antigo e o novo por um período). */
    tokens: string[];
    /** Header a ler. Default: "authorization" (espera "Bearer <token>"). */
    header?: string;
}
/**
 * Middleware Express que exige um bearer token válido.
 * Nunca aceita o token vindo do body/query — só do header, pra não repetir
 * o padrão de "cid/ch no body" que permitia forjar chamadas nos webhooks auditados.
 */
export declare function bearerAuth(options: BearerAuthOptions): (req: Request, res: Response, next: NextFunction) => void;
