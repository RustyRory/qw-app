"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeToken, type JwtPayload } from "@/lib/auth";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export interface AuthState {
  ready: boolean;
  role: string | null;
  payload: JwtPayload | null;
  logout: () => void;
}

export function useAuth(requiredRole?: string): AuthState {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    ready: false,
    role: null,
    payload: null,
    logout: () => {},
  });

  useEffect(() => {
    const token = getCookie("qw_token");

    function logout() {
      document.cookie = "qw_token=; path=/; max-age=0";
      router.push("/login");
    }

    if (!token) {
      router.push("/login");
      return;
    }

    const payload = decodeToken(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      logout();
      return;
    }

    if (
      requiredRole &&
      payload.role !== requiredRole &&
      payload.role !== "admin"
    ) {
      router.push("/dashboard");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ ready: true, role: payload.role, payload, logout });
  }, [router, requiredRole]);

  return state;
}
