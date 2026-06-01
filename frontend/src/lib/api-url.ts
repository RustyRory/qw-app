const BASE = process.env.NODE_ENV === "production" ? "/qw-app/api" : "/api";

export const apiUrl = (path: string) => `${BASE}${path}`;
