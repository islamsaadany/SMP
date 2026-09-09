/* The session, read once per request from the cookie — for pages (through
   next/headers) and for route handlers (off the Request). */
import { cookies } from "next/headers";
import { COOKIE, getSession, readCookie, doorPool, type SessionUser } from "./auth.ts";

export async function currentToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}
export async function currentUser(): Promise<SessionUser | null> {
  return getSession(doorPool(), await currentToken());
}
export function requestToken(req: Request): string | null {
  return readCookie(req.headers.get("cookie"));
}
export async function requestUser(req: Request): Promise<SessionUser | null> {
  return getSession(doorPool(), requestToken(req));
}
/* The first address in x-forwarded-for is the caller's; nothing else on the
   request is (§43's limiter counts per address). */
export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
}
export function isSecure(req: Request): boolean {
  return req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";
}
export const SLUG = /^[a-z0-9][a-z0-9-]{0,48}$/;
