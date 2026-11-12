export interface JwtPayload {
  sub: string;
  role: string;
  // Mot de passe provisoire à changer (« must change password »).
  mcp?: boolean;
  iat: number;
  exp: number;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getDashboardPath(role: string): string {
  void role;
  return "/dashboard";
}
