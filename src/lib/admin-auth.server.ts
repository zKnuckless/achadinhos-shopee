import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import process from "node:process";
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  setCookie,
  setResponseHeader,
} from "@tanstack/react-start/server";

const COOKIE_NAME = "__Host-achadinhos-admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function readConfig() {
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  return {
    password,
    sessionSecret,
    configured:
      typeof password === "string" &&
      password.length >= 12 &&
      typeof sessionSecret === "string" &&
      sessionSecret.length >= 32,
  };
}

function safePasswordCompare(candidate: string, expected: string): boolean {
  const candidateDigest = createHash("sha256").update(candidate, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

function signExpiry(expiry: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`achadinhos-admin:v1:${expiry}`, "utf8")
    .digest("base64url");
}

function isValidSession(): boolean {
  const { sessionSecret, configured } = readConfig();
  if (!configured || !sessionSecret) return false;

  const token = getCookie(COOKIE_NAME);
  if (!token) return false;

  const [expiry, signature, extra] = token.split(".");
  if (!expiry || !signature || extra !== undefined || !/^\d+$/.test(expiry)) return false;

  const expiryNumber = Number(expiry);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(expiryNumber) || expiryNumber <= now) return false;
  if (expiryNumber > now + SESSION_TTL_SECONDS + 60) return false;

  const expectedSignature = signExpiry(expiry, sessionSecret);
  const supplied = Buffer.from(signature, "base64url");
  const expected = Buffer.from(expectedSignature, "base64url");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function getClientKey(): string {
  const forwarded = getRequestHeader("x-forwarded-for");
  const realIp = getRequestHeader("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
  return ip.slice(0, 100);
}

function isRateLimited(): boolean {
  const now = Date.now();
  const key = getClientKey();
  const current = failedAttempts.get(key);
  if (!current || current.resetAt <= now) {
    failedAttempts.set(key, { count: 0, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  return current.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(): void {
  const now = Date.now();
  const key = getClientKey();
  const current = failedAttempts.get(key);
  if (!current || current.resetAt <= now) {
    failedAttempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    current.count += 1;
  }

  // Keep this best-effort in-memory guard bounded on warm server instances.
  if (failedAttempts.size > 2_000) {
    for (const [entryKey, entry] of failedAttempts) {
      if (entry.resetAt <= now) failedAttempts.delete(entryKey);
      if (failedAttempts.size <= 1_000) break;
    }
  }
}

function clearFailedAttempts(): void {
  failedAttempts.delete(getClientKey());
}

function setNoStore(): void {
  setResponseHeader("Cache-Control", "no-store, private");
  setResponseHeader("Vary", "Cookie");
}

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
};

export function getAdminStatusOnServer() {
  setNoStore();
  const { configured } = readConfig();
  return {
    configured,
    authenticated: configured && isValidSession(),
  };
}

export function loginAdminOnServer(candidate: string) {
  setNoStore();
  const { password, sessionSecret, configured } = readConfig();

  if (!configured || !password || !sessionSecret) {
    return { ok: false as const, reason: "not-configured" as const };
  }
  if (isRateLimited()) {
    return { ok: false as const, reason: "rate-limited" as const };
  }
  if (!safePasswordCompare(candidate, password)) {
    recordFailedAttempt();
    return { ok: false as const, reason: "invalid-credentials" as const };
  }

  clearFailedAttempts();
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  const signature = signExpiry(expiry, sessionSecret);
  setCookie(COOKIE_NAME, `${expiry}.${signature}`, {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS,
  });
  return { ok: true as const };
}

export function logoutAdminOnServer() {
  setNoStore();
  deleteCookie(COOKIE_NAME, cookieOptions);
  return { ok: true as const };
}
