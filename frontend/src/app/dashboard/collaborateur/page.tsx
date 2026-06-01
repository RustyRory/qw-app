import { LogoutButton } from "@/components/logout-button";

export default function CollaborateurDashboard() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Collaborateur</h1>
        <LogoutButton />
      </div>
      <p className="text-muted-foreground mt-2">
        Bienvenue sur votre espace de travail.
      </p>
    </div>
  );
}
