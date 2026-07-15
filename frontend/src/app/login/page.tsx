import { LoginForm } from "@/components/login-form";
import {
  IconShieldLock,
  IconBuildingBank,
  IconCheck,
} from "@tabler/icons-react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-violet-100 px-6 py-10">
      {/* Décor */}
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl lg:grid-cols-2">
        {/* Partie gauche */}
        <div className="hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <IconBuildingBank className="size-8" />
            </div>

            <h1 className="text-4xl font-bold leading-tight">
              QW Conseil
            </h1>

            <p className="mt-4 text-lg text-white/80">
              Plateforme de conformité LCB-FT et gestion des dossiers clients.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "Gestion des clients",
              "Cartographie des risques",
              "Planning réglementaire",
              "Opérations sensibles",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="rounded-full bg-white/15 p-1">
                  <IconCheck className="size-4" />
                </div>

                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex items-center justify-center bg-white p-8 md:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
                <IconShieldLock className="size-8 text-violet-700" />
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                Connexion
              </h2>

              <p className="mt-2 text-slate-500">
                Connectez-vous à votre espace sécurisé.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}