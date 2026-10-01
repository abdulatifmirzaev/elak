import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "radar_admin_session";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin_radar_secret_2026";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (!session?.value) return false;

  const validToken = Buffer.from(getAdminPassword()).toString("base64");
  return session.value === validToken;
}

export function createSessionToken(): string {
  return Buffer.from(getAdminPassword()).toString("base64");
}

export { SESSION_COOKIE_NAME };
