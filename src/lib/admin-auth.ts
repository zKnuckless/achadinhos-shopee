import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Only server functions cross the client/server boundary. Secrets and cookie
// handling live in the .server.ts module and are never bundled into browser JS.
export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminStatusOnServer } = await import("./admin-auth.server");
  return getAdminStatusOnServer();
});

export const loginAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(256) }))
  .handler(async ({ data }) => {
    const { loginAdminOnServer } = await import("./admin-auth.server");
    return loginAdminOnServer(data.username, data.password);
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutAdminOnServer } = await import("./admin-auth.server");
  return logoutAdminOnServer();
});
