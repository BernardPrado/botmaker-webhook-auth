import { describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rate-limit.js";

function mockReqRes(ip: string) {
  const req: any = { ip };
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
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

describe("rateLimit", () => {
  it("permite até o limite configurado e bloqueia depois", () => {
    const mw = rateLimit({ max: 2, windowMs: 60_000 });
    const a = mockReqRes("1.1.1.1");
    mw(a.req, a.res, a.next);
    mw(a.req, a.res, a.next);
    expect(a.next).toHaveBeenCalledTimes(2);

    mw(a.req, a.res, a.next);
    expect(a.next).toHaveBeenCalledTimes(2);
    expect(a.res.statusCode).toBe(429);
    expect(a.res.headers["Retry-After"]).toBeDefined();
  });

  it("não deixa uma chave controlada pelo cliente burlar o limite de outra chave", () => {
    // Regressão do achado real: keyFn default usa req.ip, nunca um valor do body.
    const mw = rateLimit({ max: 1, windowMs: 60_000 });
    const a = mockReqRes("2.2.2.2");
    const b = mockReqRes("3.3.3.3");

    mw(a.req, a.res, a.next);
    mw(b.req, b.res, b.next);

    expect(a.next).toHaveBeenCalledTimes(1);
    expect(b.next).toHaveBeenCalledTimes(1);
  });
});
