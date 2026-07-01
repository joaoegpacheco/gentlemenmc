"use client";

import { useEffect } from "react";
import { supabase } from "@/hooks/use-supabase";
import { getAuthTokenFromCookie } from "@/lib/sync-event-notifications";

function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)refreshToken=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export default function AuthListener() {
  useEffect(() => {
    const restoreSessionFromCookies = async () => {
      const accessToken = getAuthTokenFromCookie();
      const refreshToken = getRefreshTokenFromCookie();
      if (!accessToken || !refreshToken) return;

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.access_token) return;

      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    };

    void restoreSessionFromCookies();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const userEmail = session?.user.email;
        const token = session?.access_token;
        const refreshToken = session?.refresh_token;
        const secure =
          typeof window !== "undefined" && window.location.protocol === "https:"
            ? "; Secure"
            : "";

        if (token && refreshToken) {
          document.cookie = `authToken=${token}; path=/; SameSite=Lax${secure}`;
          document.cookie = `refreshToken=${refreshToken}; path=/; SameSite=Lax${secure}`;
        }

        if (token && userEmail === "barmc@gentlemenmc.com.br") {
          document.cookie = `authToken=${token}; path=/; SameSite=Lax${secure}`;
          if (refreshToken) {
            document.cookie = `refreshToken=${refreshToken}; path=/; SameSite=Lax${secure}`;
          }
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return null;
}
