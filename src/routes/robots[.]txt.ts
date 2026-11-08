import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const origin = new URL(request.url).origin;
        const body = ["User-agent: *", "Allow: /", "Disallow: /gestao", "", `Sitemap: ${origin}/sitemap.xml`].join("\n");
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
} as any);
