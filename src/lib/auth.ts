import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "scr_admin_session";

function getAdminToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;

  if (!secret || !password) {
    return null;
  }

  return createHmac("sha256", secret).update(password).digest("hex");
}

export async function setAdminSessionCookie() {
  const token = getAdminToken();
  if (!token) {
    throw new Error("Admin authentication is not configured.");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAdminAuthenticated() {
  const token = getAdminToken();
  if (!token) return false;

  const cookieStore = await cookies();
  const stored = cookieStore.get(SESSION_COOKIE)?.value;
  if (!stored) return false;

  const tokenBuffer = Buffer.from(token);
  const storedBuffer = Buffer.from(stored);

  if (tokenBuffer.length !== storedBuffer.length) return false;

  return timingSafeEqual(tokenBuffer, storedBuffer);
}
