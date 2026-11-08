import { env as runtimeEnv } from "node:process";

type AppEnv = {
  DB?: {
    prepare: (sql: string) => {
      first: <T>() => Promise<T | null>;
    };
  };
  HF_ENV?: string;
  APP_SLUG?: string;
};

// The storefront does not require Cloudflare bindings. Keep the
// optional example binding empty and expose Vercel runtime metadata.
export function bindings(): AppEnv {
  return {
    HF_ENV: runtimeEnv.VERCEL_ENV ?? "production",
    APP_SLUG: runtimeEnv.APP_SLUG ?? "achadinhos-shopee",
  };
}
