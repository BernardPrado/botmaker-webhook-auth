import { describe, expect, it, vi } from "vitest";
import { bearerAuth } from "./bearer-auth.js";

function mockReqRes(headerValue?: string) {
  const req: any = { header: (_name: string) => headerValue };
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  const next = vi.fn();
  return { req, res, next };
}

describe("bearerAuth", () => {
  it("rejeita quando não há header", () => {
    const mw = bearerAuth({ tokens: ["segredo"] });
    const { req, res, next } = mockReqRes(undefined);
    mw(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejeita token incorreto", () => {
    const mw = bearerAuth({ tokens: ["segredo"] });
    const { req, res, next } = mockReqRes("Bearer errado");
    mw(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("aceita token correto no formato Bearer", () => {
    const mw = bearerAuth({ tokens: ["segredo"] });
    const { req, res, next } = mockReqRes("Bearer segredo");
    mw(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("aceita qualquer um dos tokens configurados (rotação)", () => {
    const mw = bearerAuth({ tokens: ["antigo", "novo"] });
    const { req, res, next } = mockReqRes("Bearer novo");
    mw(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("lança erro de configuração se nenhum token for passado", () => {
    expect(() => bearerAuth({ tokens: [] })).toThrow();
  });
});
