"use client";

// Force dynamic rendering to avoid build-time prerendering errors
export const dynamic = 'force-dynamic';

import { useEffect, useMemo } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { message } from "@/lib/message";
import { supabase } from "@/hooks/use-supabase";
import { Search, Edit, Eye, UserPlus, Ban, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { MemberProfile } from "@/components/MemberProfile/page";
import { MemberForm } from "@/components/MemberForm/page";
import type { SupabaseAuthUser } from "@/types/auth";
import { useDeviceSizes } from "@/utils/mediaQueries";
import { Card, CardContent } from "@/components/ui/card";

type MemberStatus = "ativo" | "inativo" | "suspenso";

interface Member {
  id?: number;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_phone?: string;
  foto_url?: string;
  status?: MemberStatus;
  observacoes?: string;
  created_at?: string;
}

export default function MembrosPage() {
  const t = useTranslations('adminMembros');
  const members$ = useObservable<Member[]>([]);
  const loading$ = useObservable(false);
  const search$ = useObservable("");
  const selectedMember$ = useObservable<Member | null>(null);
  const profileDialogOpen$ = useObservable(false);
  const formDialogOpen$ = useObservable(false);
  const isAdmin$ = useObservable<boolean | null>(null);
  const blockDialogOpen$ = useObservable(false);
  const deleteDialogOpen$ = useObservable(false);
  const actionLoading$ = useObservable(false);

  const members = useValue(members$);
  const loading = useValue(loading$);
  const search = useValue(search$);
  const selectedMember = useValue(selectedMember$);
  const profileDialogOpen = useValue(profileDialogOpen$);
  const formDialogOpen = useValue(formDialogOpen$);
  const isAdmin = useValue(isAdmin$);
  const blockDialogOpen = useValue(blockDialogOpen$);
  const deleteDialogOpen = useValue(deleteDialogOpen$);
  const actionLoading = useValue(actionLoading$);
  const router = useRouter();
  const { isMobile } = useDeviceSizes();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user as SupabaseAuthUser | null;

      if (!user) {
        router.push("/");
        return;
      }

      const { data: admins } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin");

      const adminStatus = !!(admins && admins.length > 0);
      isAdmin$.set(adminStatus);

      if (!adminStatus && user.email !== "barmc@gentlemenmc.com.br") {
        message.error(t('errors.accessDenied'));
        router.push("/comandas");
        return;
      }

      fetchMembers();
    };

    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchMembers = async () => {
    loading$.set(true);
    try {
      const { data, error } = await supabase
        .from("membros")
        .select("*")
        .order("user_name", { ascending: true });

      if (error) {
        message.error(t('errors.errorLoadingMembers'));
      } else {
        members$.set(data || []);
      }
    } catch (err) {
      message.error(t('errors.errorFetchingMembers'));
    } finally {
      loading$.set(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const searchLower = search.toLowerCase();
    return members.filter(
      (member) =>
        member.user_name?.toLowerCase().includes(searchLower) ||
        member.user_email?.toLowerCase().includes(searchLower) ||
        member.user_phone?.toLowerCase().includes(searchLower)
    );
  }, [members, search]);

  const handleViewProfile = (member: Member) => {
    selectedMember$.set(member);
    profileDialogOpen$.set(true);
  };

  const handleEditMember = (member: Member) => {
    selectedMember$.set(member);
    formDialogOpen$.set(true);
  };

  const handleAddMember = () => {
    selectedMember$.set(null);
    formDialogOpen$.set(true);
  };

  const handleFormSuccess = () => {
    formDialogOpen$.set(false);
    selectedMember$.set(null);
    fetchMembers();
  };

  const handleBlockMember = async () => {
    if (!selectedMember) return;

    actionLoading$.set(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user as SupabaseAuthUser | null;

      if (!user) {
        message.error(t('errors.accessDenied'));
        return;
      }

      const { data: admins } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin");

      const isAdmin = !!(admins && admins.length > 0);
      const isBarMC = user.email === "barmc@gentlemenmc.com.br";

      if (!isAdmin && !isBarMC) {
        message.error(t('errors.accessDenied'));
        return;
      }

      const newStatus: MemberStatus = selectedMember.status === "suspenso" ? "ativo" : "suspenso";
      
      const { error } = await supabase
        .from("membros")
        .update({ status: newStatus })
        .eq("user_id", selectedMember.user_id);

      if (error) {
        throw error;
      }

      message.success(
        newStatus === "suspenso" 
          ? t('confirmations.blockSuccess')
          : t('confirmations.unblockSuccess')
      );
      blockDialogOpen$.set(false);
      fetchMembers();
    } catch (error: any) {
      message.error(
        selectedMember.status === "suspenso"
          ? t('confirmations.unblockError')
          : t('confirmations.blockError')
      );
    } finally {
      actionLoading$.set(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    actionLoading$.set(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user as SupabaseAuthUser | null;

      if (!user) {
        message.error(t('errors.accessDenied'));
        return;
      }

      const { data: admins } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin");

      const isAdmin = !!(admins && admins.length > 0);
      const isBarMC = user.email === "barmc@gentlemenmc.com.br";

      if (!isAdmin && !isBarMC) {
        message.error(t('errors.accessDenied'));
        return;
      }

      // Tentar deletar usando user_id primeiro
      let deleteResult = await supabase
        .from("membros")
        .delete()
        .eq("user_id", selectedMember.user_id)
        .select();

      // Se não funcionar e tiver id, tentar deletar usando id
      if (deleteResult.error && selectedMember.id) {
        deleteResult = await supabase
          .from("membros")
          .delete()
          .eq("id", selectedMember.id)
          .select();
      }

      if (deleteResult.error) {
        if (deleteResult.error.message?.includes("row-level security") || deleteResult.error.code === "42501") {
          message.error(t('errors.rlsDeleteError'));
        } else {
          throw deleteResult.error;
        }
        return;
      }

      // Verificar se algum registro foi realmente deletado
      if (!deleteResult.data || deleteResult.data.length === 0) {
        message.error(t('errors.noRecordsDeleted'));
        return;
      }

      message.success(t('confirmations.deleteSuccess'));
      deleteDialogOpen$.set(false);
      fetchMembers();
    } catch (error: any) {
      message.error(
        error?.message 
          ? `${t('confirmations.deleteError')}: ${error.message}` 
          : t('confirmations.deleteError')
      );
    } finally {
      actionLoading$.set(false);
    }
  };

  const getStatusBadge = (status?: MemberStatus) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-500">{t('status.ativo')}</Badge>;
      case "inativo":
        return <Badge variant="secondary">{t('status.inativo')}</Badge>;
      case "suspenso":
        return <Badge variant="destructive">{t('status.suspenso')}</Badge>;
      default:
        return <Badge className="bg-green-500">{t('status.ativo')}</Badge>;
    }
  };

  if (isAdmin === null) {
    return <div className="p-6">{t('loading')}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <Button onClick={handleAddMember} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t('buttons.addMember')}
        </Button>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('placeholders.search')}
            value={search}
            onChange={(e) => search$.set(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Mobile-first: Cards de membros */}
      <div className={`${isMobile ? 'block' : 'hidden lg:block'}`}>
        {loading ? (
          <div className="text-center py-8">
            {t('loading')}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('table.noMembersFound')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.user_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {member.foto_url ? (
                      <Image
                        src={member.foto_url}
                        alt={member.user_name}
                        width={48}
                        height={48}
                        className="object-cover rounded-full w-12 h-12" 
                        priority
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-lg font-medium">
                          {member.user_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{member.user_name}</h3>
                      <div className="mt-1">{getStatusBadge(member.status)}</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('table.email')}</p>
                      <p className="truncate">{member.user_email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('table.phone')}</p>
                      <p>{member.user_phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('table.registrationDate')}</p>
                      <p>
                        {member.created_at
                          ? new Date(member.created_at).toLocaleDateString("pt-BR")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(member)}
                      className="flex-1 min-w-[80px]"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('buttons.view')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMember(member)}
                      className="flex-1 min-w-[80px]"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t('buttons.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        selectedMember$.set(member);
                        blockDialogOpen$.set(true);
                      }}
                      className="flex-1 min-w-[80px]"
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      {member.status === "suspenso" ? t('buttons.unblock') : t('buttons.block')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        selectedMember$.set(member);
                        deleteDialogOpen$.set(true);
                      }}
                      className="flex-1 min-w-[80px] text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t('buttons.delete')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tabela para telas grandes */}
      {!isMobile && (
        <div className="hidden lg:block border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.name')}</TableHead>
                <TableHead>{t('table.email')}</TableHead>
                <TableHead>{t('table.phone')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.registrationDate')}</TableHead>
                <TableHead className="text-right">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {t('loading')}
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t('table.noMembersFound')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {member.foto_url ? (
                          <Image
                            src={member.foto_url}
                            alt={member.user_name}
                            width={40}
                            height={40}
                            className="object-cover rounded-full w-10 h-10" 
                            priority
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-lg">
                              {member.user_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {member.user_name}
                      </div>
                    </TableCell>
                    <TableCell>{member.user_email || "-"}</TableCell>
                    <TableCell>{member.user_phone || "-"}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProfile(member)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          {t('buttons.view')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                          className="gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          {t('buttons.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            selectedMember$.set(member);
                            blockDialogOpen$.set(true);
                          }}
                          className="gap-1"
                        >
                          <Ban className="h-4 w-4" />
                          {member.status === "suspenso" ? t('buttons.unblock') : t('buttons.block')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            selectedMember$.set(member);
                            deleteDialogOpen$.set(true);
                          }}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('buttons.delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog de Perfil */}
      <Dialog open={profileDialogOpen} onOpenChange={profileDialogOpen$.set}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dialogs.memberProfile')}</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <MemberProfile
              member={selectedMember}
              onEdit={() => {
                profileDialogOpen$.set(false);
                handleEditMember(selectedMember);
              }}
              onRefresh={fetchMembers}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Formulário */}
      <Dialog open={formDialogOpen} onOpenChange={formDialogOpen$.set}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMember ? t('dialogs.editMember') : t('dialogs.addNewMember')}
            </DialogTitle>
          </DialogHeader>
          <MemberForm
            member={selectedMember || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              formDialogOpen$.set(false);
              selectedMember$.set(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação - Bloquear/Desbloquear */}
      <ConfirmationDialog
        open={blockDialogOpen}
        onOpenChange={blockDialogOpen$.set}
        onConfirm={handleBlockMember}
        title={
          selectedMember?.status === "suspenso"
            ? t('confirmations.unblockTitle')
            : t('confirmations.blockTitle')
        }
        description={
          selectedMember?.status === "suspenso"
            ? t('confirmations.unblockDescription', { name: selectedMember?.user_name || '' })
            : t('confirmations.blockDescription', { name: selectedMember?.user_name || '' })
        }
        variant={selectedMember?.status === "suspenso" ? "default" : "warning"}
        isLoading={actionLoading}
      />

      {/* Dialog de Confirmação - Excluir */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={deleteDialogOpen$.set}
        onConfirm={handleDeleteMember}
        title={t('confirmations.deleteTitle')}
        description={t('confirmations.deleteDescription', { name: selectedMember?.user_name || '' })}
        variant="destructive"
        isLoading={actionLoading}
      />
    </div>
  );
}

