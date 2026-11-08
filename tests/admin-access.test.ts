import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("private storefront management", () => {
  test("does not expose a management button or panel on the public page", () => {
    const storefront = read("../src/routes/index.tsx");
    expect(storefront).not.toContain("Área de gestão");
    expect(storefront).not.toContain("admin-panel");
    expect(storefront).not.toContain("adminOpen");
  });

  test("uses a server-only password check and signed session cookie", () => {
    const route = read("../src/routes/gestao.tsx");
    const clientBoundary = read("../src/lib/admin-auth.ts");
    const serverAuth = read("../src/lib/admin-auth.server.ts");

    expect(route).toContain('createFileRoute("/gestao")');
    expect(route).toContain("getAdminStatus");
    expect(route).toContain("loginAdmin");
    expect(clientBoundary).toContain('import("./admin-auth.server")');
    expect(serverAuth).toContain("ADMIN_PASSWORD");
    expect(serverAuth).toContain("ADMIN_SESSION_SECRET");
    expect(serverAuth).toContain("httpOnly: true");
    expect(serverAuth).toContain("secure: true");
    expect(serverAuth).toContain('sameSite: "strict"');
    expect(serverAuth).toContain("timingSafeEqual");
    expect(serverAuth).toContain("SESSION_TTL_SECONDS");
  });

  test("keeps the private route out of search engine crawling", () => {
    const robots = read("../src/routes/robots[.]txt.ts");
    const route = read("../src/routes/gestao.tsx");
    expect(robots).toContain("Disallow: /gestao");
    expect(route).toContain("noindex, nofollow, noarchive");
  });
});
