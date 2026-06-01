export interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getDashboardPath(role: string): string {
  if (role === "admin") return "/dashboard/admin";
  if (role === "responsable") return "/dashboard/responsable";
  if (role === "expert-comptable") return "/dashboard/admin";
  return "/dashboard/collaborateur";
}
