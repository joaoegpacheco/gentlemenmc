"use client";

import { useEffect } from "react";
import { supabase } from "@/hooks/use-supabase";

export default function AuthListener() {
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const userEmail = session?.user.email;
        const token = session?.access_token;

        if (token && userEmail === "barmc@gentlemenmc.com.br") {
          // Salva o token no cookie sem expiração visível
          document.cookie = `authToken=${token}; path=/; Secure; SameSite=Lax`;
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return null;
}