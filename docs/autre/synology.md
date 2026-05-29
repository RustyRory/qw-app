API Synology (WebDAV / Drive API)

👉 C’est la solution propre, scalable, recommandée

🔧 Ce que tu dois faire côté Synology
Option la plus simple → WebDAV
Installer le package WebDAV Server sur le NAS Synology
Activer :
WebDAV HTTPS (port 5006 en général)
Créer :
un utilisateur dédié (ex: app-qw)
un dossier partagé (ex: /documents-clients)
Donner les droits à cet utilisateur
💻 Ce que tu fais côté backend (NestJS)

👉 Tu n’utilises PAS une “API officielle compliquée”
👉 Tu utilises WebDAV → c’est juste du HTTP

Exemple avec webdav (Node.js)
npm install webdav
Exemple concret :
import { createClient } from "webdav";

const client = createClient(
  "https://ton-nas:5006",
  {
    username: "app-qw",
    password: "motdepasse",
  }
);

// Upload fichier
await client.putFileContents(
  "/documents-clients/client-123/file.pdf",
  fileBuffer
);

// Télécharger
const file = await client.getFileContents(
  "/documents-clients/client-123/file.pdf"
);

// Supprimer
await client.deleteFile(
  "/documents-clients/client-123/file.pdf"
);
📁 Organisation recommandée
/documents-clients/
    /client-UUID/
        kyc.pdf
        rib.pdf
🔐 Sécurité
HTTPS obligatoire ✅
Utilisateur dédié ✅
Pas d’accès direct depuis le frontend ❌
👍 Avantages
fonctionne même si NAS ≠ serveur
scalable
propre pour architecture SaaS
🧠 2. 🖥️ Montage réseau (SMB / NAS)

👉 Solution plus simple, mais plus “infra”

🔧 Ce que tu dois faire côté Synology
Activer SMB (Panneau de config → Services fichiers)

Créer dossier partagé :

documents-clients

Créer utilisateur :

app-qw
Donner accès au dossier
💻 Ce que tu fais côté VPS (IMPORTANT)

👉 Tu montes le NAS comme un disque

Sur Linux (Ubuntu VPS)
1. Installer client SMB
sudo apt install cifs-utils
2. Créer dossier local
sudo mkdir /mnt/synology
3. Monter le NAS
sudo mount -t cifs //IP_DU_NAS/documents-clients /mnt/synology \
-o username=app-qw,password=motdepasse,vers=3.0
4. Maintenant côté Node.js

👉 C’est comme un disque local

import * as fs from "fs";

fs.writeFileSync(
  "/mnt/synology/client-123/file.pdf",
  fileBuffer
);
⚠️ Pour que ça survive au reboot

Modifier /etc/fstab :

//IP_DU_NAS/documents-clients /mnt/synology cifs username=app-qw,password=motdepasse,vers=3.0 0 0
⚠️ Contraintes IMPORTANTES
Le NAS doit être accessible réseau depuis le VPS
Si VPS cloud (OVH, AWS…) :
👉 ça marche seulement si VPN ou réseau privé
🚨 Donc choix stratégique
👉 Si ton NAS est LOCAL (entreprise)

✔️ SMB = OK
✔️ + simple
❌ mais dépend du réseau

👉 Si ton NAS est distant / cloud

❌ SMB compliqué
✔️ WebDAV recommandé