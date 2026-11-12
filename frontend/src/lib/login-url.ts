// URL absolue de la page de connexion, préfixe de production inclus.
// À utiliser hors du routeur Next.js (window.location), qui, lui, ajoute le
// basePath tout seul : sans le préfixe, la redirection mène à /login, une
// page qui n'existe pas en production (servie sous /qw-app).
const BASE = process.env.NODE_ENV === "production" ? "/qw-app" : "";

export const LOGIN_URL = `${BASE}/login`;
