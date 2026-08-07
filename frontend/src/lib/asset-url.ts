const BASE = process.env.NODE_ENV === "production" ? "/qw-app" : "";

export const assetUrl = (path: string) => `${BASE}${path}`;
