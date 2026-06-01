"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    document.cookie = "qw_token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Se déconnecter
    </Button>
  );
}
