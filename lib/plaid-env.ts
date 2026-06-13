import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export type PlaidEnv = "production" | "development" | "sandbox";

export function getPlaidEnv(req?: NextRequest): PlaidEnv {
  // 1. Cookie override (per-request scope)
  if (req) {
    const cookieEnv = req.cookies.get("plaid_env")?.value;
    if (cookieEnv && ["production", "development", "sandbox"].includes(cookieEnv)) {
      return cookieEnv as PlaidEnv;
    }
  }
  // 2. Fallback to system env
  const env = process.env.PLAID_ENV || "production";
  if (["production", "development", "sandbox"].includes(env)) return env as PlaidEnv;
  return "production";
}

export function plaidBaseUrl(env: PlaidEnv): string {
  switch (env) {
    case "production": return "https://production.plaid.com";
    case "development": return "https://development.plaid.com";
    case "sandbox": return "https://sandbox.plaid.com";
  }
}
