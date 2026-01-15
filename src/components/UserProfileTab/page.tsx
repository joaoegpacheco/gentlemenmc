"use client";

import { useEffect, useCallback } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { supabase } from "@/hooks/use-supabase";
import { UserProfileForm } from "@/components/UserProfileForm/page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Member {
  user_id: string;
  user_name: string;
  user_email?: string;
  phone?: string;
  foto_url?: string;
  status?: "ativo" | "inativo" | "suspenso";
}

export function UserProfileTab() {
  const loading$ = useObservable(true);
  const member$ = useObservable<Member | null>(null);
  const user$ = useObservable<any>(null);

  const loading = useValue(loading$);
  const member = useValue(member$);
  const user = useValue(user$);

  const fetchUserData = useCallback(async () => {
    try {
      // Buscar usuário autenticado
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        return;
      }

      user$.set(userData.user);

      // Buscar dados do membro na tabela membros
      const { data: memberData, error: memberError } = await supabase
        .from("membros")
        .select("user_id, user_name, user_email, phone, foto_url, status")
        .eq("user_id", userData.user.id)
        .single();

      if (memberError) {
        console.error("Erro ao buscar dados do membro:", memberError);
        // Mesmo se não encontrar na tabela membros, permitir acesso com dados básicos do auth
        member$.set({
          user_id: userData.user.id,
          user_name: userData.user.user_metadata?.user_name || userData.user.email || "Usuário",
          user_email: userData.user.email,
          foto_url: undefined,
        });
      } else {
        member$.set(memberData);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      loading$.set(false);
    }
  }, [loading$, member$, user$]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSuccess = () => {
    // Recarregar dados após atualização
    fetchUserData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!member || !user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Erro ao carregar dados do perfil.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{member.user_name}</CardTitle>
          <CardDescription>
            Atualize sua senha e foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfileForm member={member} user={user} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}

