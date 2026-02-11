"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useEffect, useMemo } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { message } from "@/lib/message";
import { supabase } from "@/hooks/use-supabase";
import { Search, CheckCircle2, CircleQuestionMark, XCircle, Plus, User, Target, Scale } from "lucide-react";
import type { SupabaseAuthUser } from "@/types/auth";
import { format, differenceInMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Progress } from "@/components/ui/progress";

interface Member {
  id?: number;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_phone?: string;
  foto_url?: string;
  case_type?: string;
  created_at?: string;
  half_date?: string;
}

interface ProspectActivity {
  id?: number;
  prospect_id: string;
  activity_type: string;
  points: number;
  activity_date: string;
  description?: string;
  validated_by?: string;
  validated_at?: string;
  status: "pending" | "validated" | "rejected";
  created_at?: string;
}

interface ProspectPenalty {
  id?: number;
  prospect_id: string;
  severity: "leve" | "medio" | "grave";
  points_deducted: number;
  infraction_type?: string;
  description?: string;
  created_at?: string;
  created_by?: string;
  status?: "pending" | "validated" | "rejected";
}

// Tipos de atividades e seus pontos (labels serão traduzidos dinamicamente)
const ACTIVITY_TYPES_CONFIG = {
  "presenca_proatividade": {
    key: "presencaProatividade",
    points: 10,
    monthlyLimit: true,
  },
  "rodar_2_fds": {
    key: "rodar2Fds",
    points: 5,
    monthlyLimit: false,
  },
  "open_house_outros_mc": {
    key: "openHouseOutrosMc",
    points: 5,
    monthlyLimit: false,
  },
  "acoes_filantropicas": {
    key: "acoesFilantropicas",
    points: 5,
    monthlyLimit: false,
  },
  "viajar_com_clube": {
    key: "viajarComClube",
    points: 10,
    monthlyLimit: false,
  },
  "viajar_sem_clube": {
    key: "viajarSemClube",
    points: 5,
    monthlyLimit: false,
  },
  "organizar_open_house": {
    key: "organizarOpenHouse",
    points: 5,
    monthlyLimit: false,
  },
} as const;

type ActivityType = keyof typeof ACTIVITY_TYPES_CONFIG;

const HALF_PATCH_REQUIREMENTS = { minMonths: 6, minPoints: 100 };
const FULL_PATCH_REQUIREMENTS = { minMonths: 6, minPoints: 150 };

interface ProspectStats {
  totalPoints: number;
  monthsAsProspect: number;
  halfPatchPointsProgress: number;
  halfPatchTimeProgress: number;
  halfPatchPointsMet: boolean;
  halfPatchTimeMet: boolean;
  halfPatchEligible: boolean;
  fullPatchPointsProgress: number;
  fullPatchTimeProgress: number;
  fullPatchPointsMet: boolean;
  fullPatchTimeMet: boolean;
  fullPatchEligible: boolean;
  monthsAsHalf: number;
  halfPatchDate: Date | null;
}

function computeStatsForMember(member: Member, activities: ProspectActivity[], penalties: ProspectPenalty[] = []): ProspectStats {
  const startDate = member.created_at ? parseISO(member.created_at) : new Date();
  const monthsAsProspect = differenceInMonths(new Date(), startDate);
  const activityPoints = activities
    .filter((a) => a.status === "validated")
    .reduce((sum, a) => sum + a.points, 0);

  // Penalties are already filtered by prospect_id before being passed to this function
  const penaltyDeduction = penalties.reduce((sum, p) => sum + Math.abs(p.points_deducted), 0);

  const totalPoints = Math.max(0, activityPoints - penaltyDeduction);

  const halfPatchPointsProgress = Math.min((totalPoints / HALF_PATCH_REQUIREMENTS.minPoints) * 100, 100);
  const halfPatchTimeProgress = Math.min((monthsAsProspect / HALF_PATCH_REQUIREMENTS.minMonths) * 100, 100);
  const halfPatchPointsMet = totalPoints >= HALF_PATCH_REQUIREMENTS.minPoints;
  const halfPatchTimeMet = monthsAsProspect >= HALF_PATCH_REQUIREMENTS.minMonths;
  const halfPatchEligible = halfPatchPointsMet && halfPatchTimeMet;

  const isHalf = member.case_type === "Half";
  let halfPatchDate: Date | null = null;
  if (isHalf) {
    if (member.half_date) {
      halfPatchDate = parseISO(member.half_date);
    } else {
      const sortedActivities = [...activities]
        .filter((a) => a.status === "validated")
        .sort((a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime());
      let accumulatedPoints = 0;
      for (const activity of sortedActivities) {
        accumulatedPoints += activity.points;
        const activityDate = parseISO(activity.activity_date);
        const monthsSinceStart = differenceInMonths(activityDate, startDate);
        if (accumulatedPoints >= HALF_PATCH_REQUIREMENTS.minPoints && monthsSinceStart >= HALF_PATCH_REQUIREMENTS.minMonths) {
          halfPatchDate = activityDate;
          break;
        }
      }
      if (!halfPatchDate) {
        const minHalfDate = new Date(startDate);
        minHalfDate.setMonth(minHalfDate.getMonth() + HALF_PATCH_REQUIREMENTS.minMonths);
        halfPatchDate = minHalfDate;
      }
    }
  }

  const monthsAsHalf = halfPatchDate
    ? differenceInMonths(new Date(), halfPatchDate)
    : halfPatchEligible
      ? Math.max(0, monthsAsProspect - HALF_PATCH_REQUIREMENTS.minMonths)
      : 0;

  const fullPatchPointsProgress = Math.min((totalPoints / FULL_PATCH_REQUIREMENTS.minPoints) * 100, 100);
  const fullPatchTimeProgress = Math.min((monthsAsHalf / FULL_PATCH_REQUIREMENTS.minMonths) * 100, 100);
  const fullPatchPointsMet = totalPoints >= FULL_PATCH_REQUIREMENTS.minPoints;
  const fullPatchTimeMet = monthsAsHalf >= FULL_PATCH_REQUIREMENTS.minMonths;
  const fullPatchEligible = fullPatchPointsMet && fullPatchTimeMet;

  return {
    totalPoints,
    monthsAsProspect,
    halfPatchPointsProgress,
    halfPatchTimeProgress,
    halfPatchPointsMet,
    halfPatchTimeMet,
    halfPatchEligible,
    fullPatchPointsProgress,
    fullPatchTimeProgress,
    fullPatchPointsMet,
    fullPatchTimeMet,
    fullPatchEligible,
    monthsAsHalf,
    halfPatchDate,
  };
}

export default function ProspectValidationPage() {
  const t = useTranslations('common');
  const tValidation = useTranslations('prospectValidation');
  const tProspects = useTranslations('prospectsPage');
  const members$ = useObservable<Member[]>([]);
  const allMembers$ = useObservable<Member[]>([]); // Todos os membros (incluindo Diretoria) para buscar nomes
  const activities$ = useObservable<ProspectActivity[]>([]);
  const penalties$ = useObservable<ProspectPenalty[]>([]);
  const loading$ = useObservable(false);
  const search$ = useObservable("");
  const selectedProspect$ = useObservable<Member | null>(null);
  const formDialogOpen$ = useObservable(false);
  const penaltyDialogOpen$ = useObservable(false);
  const pendingDialogOpen$ = useObservable(false);
  const isDiretoria$ = useObservable<boolean | null>(null);
  const currentUser$ = useObservable<{ id: string; name: string; case_type?: string } | null>(null);
  const actionLoading$ = useObservable(false);

  // Form state
  const activityType$ = useObservable<ActivityType | "">("");
  const activityDate$ = useObservable<string>("");
  const description$ = useObservable<string>("");
  const prospectSearch$ = useObservable<string>("");

  // Penalty form state
  const penaltySeverity$ = useObservable<"leve" | "medio" | "grave" | "">("");
  const penaltyDescription$ = useObservable<string>("");

  const members = useValue(members$);
  const allMembers = useValue(allMembers$); // Todos os membros para buscar nomes
  const activities = useValue(activities$);
  const penalties = useValue(penalties$);
  const loading = useValue(loading$);
  const search = useValue(search$);
  const selectedProspect = useValue(selectedProspect$);
  const formDialogOpen = useValue(formDialogOpen$);
  const penaltyDialogOpen = useValue(penaltyDialogOpen$);
  const isDiretoria = useValue(isDiretoria$);
  const currentUser = useValue(currentUser$);
  const actionLoading = useValue(actionLoading$);
  const activityType = useValue(activityType$);
  const activityDate = useValue(activityDate$);
  const description = useValue(description$);
  const prospectSearch = useValue(prospectSearch$);
  const penaltySeverity = useValue(penaltySeverity$);
  const penaltyDescription = useValue(penaltyDescription$);

  const pendingDialogOpen = useValue(pendingDialogOpen$);

  const router = useRouter();

  useEffect(() => {
    checkPermissions();
    fetchProspects();
    fetchActivities();
    fetchPenalties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPermissions = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user as SupabaseAuthUser | null;

    if (!user) {
      router.push("/");
      return;
    }

    // Buscar o membro atual para verificar case_type
    const { data: memberData } = await supabase
      .from("membros")
      .select("user_id, user_name, case_type")
      .eq("user_id", user.id)
      .single();

    if (memberData) {
      const hasAccess = memberData.case_type === "Diretoria" || memberData.case_type === "Full-Revisor";
      isDiretoria$.set(hasAccess);
      currentUser$.set({
        id: user.id,
        name: memberData.user_name || user.email || t('name'),
        case_type: memberData.case_type,
      });

      if (!hasAccess) {
        message.error(tValidation('errors.accessDenied'));
        router.push("/admin/membros");
        return;
      }
    } else {
      message.error(tValidation('errors.userNotFound'));
      router.push("/admin/membros");
      return;
    }
  };

  const fetchProspects = async () => {
    loading$.set(true);
    try {
      // Buscar todos os membros (prospectos são identificados por case_type null ou "Prospect")
      // Na prática, você pode ajustar este filtro conforme sua necessidade
      const { data, error } = await supabase
        .from("membros")
        .select("*")
        .order("user_name", { ascending: true });

      if (error) {
        console.error("Erro ao carregar membros:", error);
        message.error(tValidation('errors.errorLoadingProspects'));
        members$.set([]);
        allMembers$.set([]);
      } else {
        // Armazenar TODOS os membros (incluindo Diretoria) para buscar nomes de validadores
        allMembers$.set(data || []);

        // Filtrar apenas "Half" e "Prospect" para a lista de prospects
        const prospects = (data || []).filter(
          (m) => m.case_type === "Half" || m.case_type === "Prospect"
        );
        members$.set(prospects);
      }
    } catch (err) {
      console.error("Erro ao buscar prospectos:", err);
      message.error(tValidation('errors.errorFetchingProspects'));
      members$.set([]);
      allMembers$.set([]);
    } finally {
      loading$.set(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("prospect_activities")
        .select("*")
        .order("activity_date", { ascending: false });

      if (error) {
        // Se a tabela não existir, mostrar mensagem amigável
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn("Tabela prospect_activities não existe ainda. Execute a migration SQL primeiro.");
          activities$.set([]);
        } else {
          console.error("Erro ao buscar atividades:", error);
          message.error(tValidation('errors.errorLoadingActivities'));
          activities$.set([]);
        }
      } else {
        activities$.set(data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar atividades:", err);
      activities$.set([]);
    }
  };

  const fetchPenalties = async () => {
    try {
      const { data, error } = await supabase
        .from("prospect_penalties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn("Tabela prospect_penalties não existe ainda.");
          penalties$.set([]);
        } else {
          console.error("Erro ao buscar penalidades:", error);
          penalties$.set([]);
        }
      } else {
        penalties$.set(data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar penalidades:", err);
      penalties$.set([]);
    }
  };

  const filteredProspects = useMemo(() => {
    // Filtrar apenas "Half" e "Prospect", excluindo "Diretoria" e "Full"
    const validMembers = members.filter(
      (m) => m.case_type === "Half" || m.case_type === "Prospect"
    );

    if (!prospectSearch) return validMembers;
    const searchLower = prospectSearch.toLowerCase();
    return validMembers.filter(
      (member) =>
        member.user_name?.toLowerCase().includes(searchLower) ||
        member.user_email?.toLowerCase().includes(searchLower)
    );
  }, [members, prospectSearch]);

  const filteredActivities = useMemo(() => {
    // Filtrar atividades apenas de membros que são "Half" ou "Prospect"
    const validProspectIds = new Set(
      members
        .filter((m) => m.case_type === "Half" || m.case_type === "Prospect")
        .map((m) => m.user_id)
    );

    let filtered = activities.filter((activity) =>
      validProspectIds.has(activity.prospect_id)
    );

    // Aplicar busca se houver
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((activity) => {
        const prospect = members.find((m) => m.user_id === activity.prospect_id);
        const prospectName = prospect?.user_name || "";
        return (
          activity.description?.toLowerCase().includes(searchLower) ||
          activity.activity_type?.toLowerCase().includes(searchLower) ||
          prospectName.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [activities, search, members]);

  const handleOpenForm = (prospect?: Member) => {
    selectedProspect$.set(prospect || null);
    activityType$.set("");
    activityDate$.set(format(new Date(), "yyyy-MM-dd"));
    description$.set("");
    prospectSearch$.set("");
    formDialogOpen$.set(true);
  };

  const handleSubmitActivity = async () => {
    if (!activityType || !activityDate || !selectedProspect || !currentUser) {
      message.error(tValidation('errors.fillAllFields'));
      return;
    }

    const isFullRevisor = currentUser.case_type === "Full-Revisor";

    const activityConfig = ACTIVITY_TYPES_CONFIG[activityType];
    if (!activityConfig) {
      message.error(tValidation('errors.invalidActivityType'));
      return;
    }

    // Verificar limite mensal se aplicável
    if (activityConfig.monthlyLimit) {
      const activityDateObj = new Date(activityDate);
      const monthStart = new Date(activityDateObj.getFullYear(), activityDateObj.getMonth(), 1);
      const monthEnd = new Date(activityDateObj.getFullYear(), activityDateObj.getMonth() + 1, 0);

      const existingActivities = activities.filter(
        (a) =>
          a.prospect_id === selectedProspect.user_id &&
          a.activity_type === activityType &&
          a.status === "validated" &&
          new Date(a.activity_date) >= monthStart &&
          new Date(a.activity_date) <= monthEnd
      );

      if (existingActivities.length > 0) {
        message.error(
          tValidation('errors.activityAlreadyRegistered', { month: format(monthStart, "MMMM 'de' yyyy", { locale: ptBR }) })
        );
        return;
      }
    }

    actionLoading$.set(true);
    try {
      const { data, error } = await supabase
        .from("prospect_activities")
        .insert([
          {
            prospect_id: selectedProspect.user_id,
            activity_type: activityType,
            points: activityConfig.points,
            activity_date: activityDate,
            description: description,
            validated_by: isFullRevisor ? null : currentUser.id,
            validated_at: isFullRevisor ? null : new Date().toISOString(),
            // Diretoria valida automaticamente; Full-Revisor cria como pendente
            status: isFullRevisor ? "pending" : "validated",
          },
        ])
        .select();

      if (error) {
        console.error("Erro do Supabase ao registrar atividade:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Verificar se a tabela não existe
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          message.error(tValidation('errors.tableNotFound'));
        } else if (error.code === "23503") {
          message.error(tValidation('errors.prospectNotFound'));
        } else if (error.code === "23505") {
          message.error(tValidation('errors.activityAlreadyExists'));
        } else {
          message.error(tValidation('errors.errorRegisteringUnknown', { message: error.message || tValidation('errors.unknownError') }));
        }
        return;
      }

      message.success(tValidation('success.activityRegistered'));
      formDialogOpen$.set(false);
      fetchActivities();
      activityType$.set("");
      activityDate$.set(format(new Date(), "yyyy-MM-dd"));
      description$.set("");
      selectedProspect$.set(null);
      prospectSearch$.set("");
    } catch (error: any) {
      console.error("Erro inesperado ao registrar atividade:", {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(tValidation('errors.errorRegistering', { message: errorMessage || tValidation('errors.unknownError') }));
    } finally {
      actionLoading$.set(false);
    }
  };

  const handleSubmitPenalty = async () => {
    if (!penaltySeverity || !selectedProspect || !currentUser) {
      message.error(tValidation('errors.fillAllFields'));
      return;
    }

    const isFullRevisor = currentUser.case_type === "Full-Revisor";

    const pointsMap = {
      leve: 5,
      medio: 10,
      grave: 20,
    };

    actionLoading$.set(true);
    try {
      const { data, error } = await supabase
        .from("prospect_penalties")
        .insert([
          {
            prospect_id: selectedProspect.user_id,
            severity: penaltySeverity,
            points_deducted: pointsMap[penaltySeverity],
            description: penaltyDescription || null,
            created_by: currentUser.id,
            // Full-Revisor cria penalidades como pendentes; Diretoria já pode considerar como validadas
            status: isFullRevisor ? "pending" : "validated",
          },
        ])
        .select();

      if (error) {
        console.error("Erro do Supabase ao registrar penalidade:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          message.error(tValidation('errors.penaltyTableNotFound'));
        } else if (error.code === "23503") {
          message.error(tValidation('errors.prospectNotFound'));
        } else if (error.code === "23505") {
          message.error(tValidation('errors.penaltyAlreadyExists'));
        } else {
          message.error(tValidation('errors.errorRegisteringPenaltyUnknown', { message: error.message || tValidation('errors.unknownError') }));
        }
        return;
      }

      message.success(tValidation('success.penaltyRegistered'));
      penaltyDialogOpen$.set(false);
      fetchPenalties();
      penaltySeverity$.set("");
      penaltyDescription$.set("");
      selectedProspect$.set(null);
      prospectSearch$.set("");
    } catch (error: any) {
      console.error("Erro inesperado ao registrar penalidade:", {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(tValidation('errors.errorRegisteringPenaltyUnknown', { message: errorMessage || tValidation('errors.unknownError') }));
    } finally {
      actionLoading$.set(false);
    }
  };

  const getActivityLabel = (type: string) => {
    const config = ACTIVITY_TYPES_CONFIG[type as ActivityType];
    if (config) {
      try {
        return tValidation(`activityTypes.${config.key}.label`);
      } catch {
        return type;
      }
    }
    return type;
  };

  const getProspectName = (prospectId: string) => {
    const prospect = members.find((m) => m.user_id === prospectId);
    return prospect?.user_name || tValidation('desconhecido');
  };

  const getValidatorName = (validatorId: string) => {
    // Buscar em todos os membros (incluindo Diretoria) para encontrar o validador
    const validator = allMembers.find((m) => m.user_id === validatorId);
    return validator?.user_name || tValidation('desconhecido');
  };

  const getCreatorName = (creatorId: string) => {
    // Buscar em todos os membros (incluindo Diretoria) para encontrar quem criou/registrou
    const creator = allMembers.find((m) => m.user_id === creatorId);
    return creator?.user_name || tValidation('desconhecido');
  };

  const getPenaltyCountByType = (memberPenalties: ProspectPenalty[], severity: "leve" | "medio" | "grave") => {
    return memberPenalties.filter(p => p.severity === severity).length;
  };

  const renderPenaltyInfo = (memberPenalties: ProspectPenalty[]) => {
    if (memberPenalties.length === 0) return null;

    const grave = getPenaltyCountByType(memberPenalties, "grave");
    const medio = getPenaltyCountByType(memberPenalties, "medio");
    const leve = getPenaltyCountByType(memberPenalties, "leve");

    return (
      <>
        {grave > 0 && (
          <span className="text-red-600">
            {" "}({grave} {grave > 1 ? tProspects('penalidades_count') : tProspects('penalidade')} {grave > 1 ? tProspects('graves') : tProspects('grave')})
          </span>
        )}
        {medio > 0 && (
          <span className="text-orange-600">
            {" "}({medio} {medio > 1 ? tProspects('penalidades_count') : tProspects('penalidade')} {medio > 1 ? tProspects('medias') : tProspects('media')})
          </span>
        )}
        {leve > 0 && (
          <span className="text-yellow-600">
            {" "}({leve} {leve > 1 ? tProspects('penalidades_count') : tProspects('penalidade')} {leve > 1 ? tProspects('leves') : tProspects('leve')})
          </span>
        )}
      </>
    );
  };

  // Listas de pendências para aprovação da Diretoria
  const pendingActivities = useMemo(
    () => activities.filter((a) => a.status === "pending"),
    [activities]
  );

  const pendingPenalties = useMemo(
    () => penalties.filter((p) => p.status === "pending"),
    [penalties]
  );

  const isDiretoriaMember = currentUser?.case_type === "Diretoria";

  const handleApproveActivity = async (activityId?: number) => {
    if (!activityId || !currentUser) return;

    actionLoading$.set(true);
    try {
      const { error } = await supabase
        .from("prospect_activities")
        .update({
          status: "validated",
          validated_by: currentUser.id,
          validated_at: new Date().toISOString(),
        })
        .eq("id", activityId);

      if (error) {
        console.error("Erro ao aprovar atividade:", error);
        message.error(tValidation('errors.approveActivityFailed'));
        return;
      }

      message.success(tValidation('success.activityApproved'));
      fetchActivities();
    } catch (err) {
      console.error("Erro inesperado ao aprovar atividade:", err);
      message.error(tValidation('errors.approveActivityError'));
    } finally {
      actionLoading$.set(false);
    }
  };

  const handleApprovePenalty = async (penaltyId?: number) => {
    if (!penaltyId || !currentUser) return;

    actionLoading$.set(true);
    try {
      const { error } = await supabase
        .from("prospect_penalties")
        .update({
          status: "validated",
        })
        .eq("id", penaltyId);

      if (error) {
        console.error("Erro ao aprovar penalidade:", error);
        message.error(tValidation('errors.approvePenaltyFailed'));
        return;
      }

      message.success(tValidation('success.penaltyApproved'));
      fetchPenalties();
    } catch (err) {
      console.error("Erro inesperado ao aprovar penalidade:", err);
      message.error(tValidation('errors.approvePenaltyError'));
    } finally {
      actionLoading$.set(false);
    }
  };

  // Calcular totais por prospect (apenas Half e Prospect)
  const prospectTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const validProspectIds = new Set(
      members
        .filter((m) => m.case_type === "Half" || m.case_type === "Prospect")
        .map((m) => m.user_id)
    );

    activities
      .filter((a) => a.status === "validated" && validProspectIds.has(a.prospect_id))
      .forEach((activity) => {
        totals[activity.prospect_id] = (totals[activity.prospect_id] || 0) + activity.points;
      });
    return totals;
  }, [activities, members]);

  // Lista de prospects/halves com estatísticas (todos, com ou sem validação)
  const prospectProgressList = useMemo(() => {
    const validMembers = members.filter(
      (m) => m.case_type === "Half" || m.case_type === "Prospect"
    );
    return validMembers.map((member) => {
      const memberActivities = activities.filter((a) => a.prospect_id === member.user_id);
      const memberPenalties = penalties.filter((p) => p.prospect_id === member.user_id);
      const stats = computeStatsForMember(member, memberActivities, memberPenalties);

      return { member, stats, memberPenalties };
    });
  }, [members, activities, penalties]);

  if (isDiretoria === null) {
    return (
      <AdminLayout>
        <div className="p-6">{tValidation('verificandoPermissoes')}</div>
      </AdminLayout>
    );
  }

  if (!isDiretoria) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{tValidation('errors.accessDenied')}</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{tValidation('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {tValidation('subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          {isDiretoriaMember && (
            <Button
              onClick={() => pendingDialogOpen$.set(true)}
              variant="outline"
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {tValidation('pendenciasParaAprovar')}
            </Button>
          )}
          <Button onClick={() => handleOpenForm()} className="gap-2">
            <Plus className="h-4 w-4" />
            {tValidation('registrarAtividade')}
          </Button>
          <Button onClick={() => penaltyDialogOpen$.set(true)} variant="destructive" className="gap-2">
            <Scale className="h-4 w-4" />
            {tValidation('incluirPenalidade')}
          </Button>
        </div>
      </div>

      {/* Regras do Sistema */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{tValidation('regrasSistema')}</CardTitle>
        </CardHeader>
        <div className="flex">
          <CardContent className="space-y-2 text-sm">
            <CardHeader>
              <CardTitle>{tValidation('atividades')}</CardTitle>
            </CardHeader>
            <div>
              <strong>{tValidation('halfPatchRule')}</strong>
            </div>
            <div>
              <strong>{tValidation('fullPatchRule')}</strong>
            </div>
            <div className="mt-4">
              <strong>{tValidation('pontosMensaisComportamento')}</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>{tValidation('presencaProatividade')}</li>
              </ul>
            </div>
            <div className="mt-2">
              <strong>{tValidation('pontosAtividades')}</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>{tValidation('rodar2Fds')}</li>
                <li>{tValidation('openHouseOutrosMc')}</li>
                <li>{tValidation('acoesFilantropicas')}</li>
                <li>{tValidation('viajarComClube')}</li>
                <li>{tValidation('viajarSemClube')}</li>
                <li>{tValidation('organizarOpenHouse')}</li>
              </ul>
            </div>
          </CardContent>
          <CardContent className="space-y-2 text-sm">
            <CardHeader>
              <CardTitle>{tValidation('penalidades')}</CardTitle>
            </CardHeader>

            {/* Infrações leves */}
            <div className="mt-2">
              <strong>{tValidation('infracoesLevesTitulo')}</strong>
              <div className="text-xs text-muted-foreground">
                {tValidation('infracoesLevesSubtitulo')}
              </div>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>{tValidation('atrasosPontuais')}</li>
                <li>{tValidation('desatencao')}</li>
                <li>{tValidation('faltaPostura')}</li>
                <li>{tValidation('comunicacaoInadequada')}</li>
                <li>{tValidation('aparencia')}</li>
                <li>{tValidation('faltaIniciativa')}</li>
              </ul>
            </div>

            {/* Infrações médias */}
            <div className="mt-4">
              <strong>{tValidation('infracoesMediasTitulo')}</strong>
              <div className="text-xs text-muted-foreground">
                {tValidation('infracoesMediasSubtitulo')}
              </div>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>{tValidation('reincidencia')}</li>
                <li>{tValidation('ausenciaInjustificada')}</li>
                <li>{tValidation('exposicaoIndevida')}</li>
                <li>{tValidation('condutaSocialImpropria')}</li>
                <li>{tValidation('questionamento')}</li>
                <li>{tValidation('quebraHierarquia')}</li>
              </ul>
            </div>

            {/* Infrações graves */}
            <div className="mt-4">
              <strong>{tValidation('infracoesGravesTitulo')}</strong>
              <div className="text-xs text-muted-foreground">
                {tValidation('infracoesGravesSubtitulo')}
              </div>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>{tValidation('deslealdade')}</li>
                <li>{tValidation('desrespeito')}</li>
                <li>{tValidation('condutaAntietica')}</li>
                <li>{tValidation('falsidade')}</li>
                <li>{tValidation('usoIndevidoNome')}</li>
                <li>{tValidation('atitudeIncompativel')}</li>
              </ul>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tValidation('buscarAtividades')}
            value={search}
            onChange={(e) => search$.set(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle>{tValidation('historicoAtividades')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{tValidation('carregando')}</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {tValidation('nenhumaAtividade')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tValidation('prospect')}</TableHead>
                    <TableHead>{tValidation('atividade')}</TableHead>
                    <TableHead>{tValidation('data')}</TableHead>
                    <TableHead>{tValidation('pontos')}</TableHead>
                    <TableHead>{tValidation('descricao')}</TableHead>
                    <TableHead>{tValidation('validadoPor')}</TableHead>
                    <TableHead>{tValidation('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        {getProspectName(activity.prospect_id)}
                      </TableCell>
                      <TableCell>{getActivityLabel(activity.activity_type)}</TableCell>
                      <TableCell>
                        {activity.activity_date
                          ? format(new Date(activity.activity_date), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold">
                          +{activity.points} pts
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {activity.description || "-"}
                      </TableCell>
                      <TableCell>
                        {activity.validated_by
                          ? getValidatorName(activity.validated_by)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {activity.status === "validated" ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {tValidation('validado')}
                          </Badge>
                        ) : activity.status === "rejected" ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            {tValidation('rejeitado')}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500" variant="secondary">
                            <CircleQuestionMark className="h-3 w-3 mr-1" />
                            {tValidation('pendente')}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Penalidades */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {tProspects('historicoPenalidades')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{tValidation('carregando')}</div>
          ) : penalties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tProspects('nenhumaPenalidade')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tValidation('prospect')}</TableHead>
                    <TableHead>{tValidation('data')}</TableHead>
                    <TableHead>{tValidation('severidade')}</TableHead>
                    <TableHead>{tValidation('pontos')}</TableHead>
                    <TableHead>{tValidation('descricao')}</TableHead>
                    <TableHead>{tValidation('registradoPor')}</TableHead>
                    <TableHead>{tValidation('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penalties.map((penalty) => (
                    <TableRow key={penalty.id}>
                      <TableCell className="font-medium">
                        {getProspectName(penalty.prospect_id)}
                      </TableCell>
                      <TableCell>
                        {penalty.created_at
                          ? format(parseISO(penalty.created_at), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            penalty.severity === "grave"
                              ? "destructive"
                              : penalty.severity === "medio"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {penalty.severity === "grave"
                            ? tProspects('severidadeGrave')
                            : penalty.severity === "medio"
                              ? tProspects('severidadeMedia')
                              : tProspects('severidadeLeve')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="font-semibold">
                          -{penalty.points_deducted} pts
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {penalty.description || penalty.infraction_type || "-"}
                      </TableCell>
                      <TableCell>
                        {penalty.created_by
                          ? getCreatorName(penalty.created_by)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {penalty.status === "validated" ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {tValidation('validado')}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500" variant="secondary">
                            <CircleQuestionMark className="h-3 w-3 mr-1" />
                            {tValidation('pendente')}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visão de progresso por Prospect / Half (mesma visão da ProspectsPage) */}
      <div className="mt-6 space-y-6">
        <h2 className="text-xl font-semibold">{tValidation('resumoPontos')}</h2>
        {prospectProgressList.length === 0 ? (
          <p className="text-muted-foreground">{tValidation('nenhumPonto')}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {prospectProgressList.map(({ member, stats, memberPenalties }) => (
              <Card key={member.user_id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{member.user_name}</CardTitle>
                    <Badge variant="outline">{member.case_type === "Half" ? tProspects('halfPatch') : tProspects('prospect')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Prospect: card Half Patch */}
                  {member.case_type !== "Half" && (
                    <>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{tProspects('meritoPontos')}</span>
                          <span className="text-sm font-bold">{stats.totalPoints} / {HALF_PATCH_REQUIREMENTS.minPoints}</span>
                        </div>
                        <Progress value={stats.halfPatchPointsProgress} className="h-3" />
                        {stats.halfPatchPointsMet ? (
                          <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-semibold">{tProspects('requisitoAtingido')}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">
                            {tProspects('faltamPontos', { points: HALF_PATCH_REQUIREMENTS.minPoints - stats.totalPoints })}
                            {renderPenaltyInfo(memberPenalties)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{tProspects('tempoCasaMeses')}</span>
                          <span className="text-sm font-bold">{stats.monthsAsProspect} / {HALF_PATCH_REQUIREMENTS.minMonths}</span>
                        </div>
                        <Progress value={stats.halfPatchTimeProgress} className="h-3" />
                        {stats.halfPatchTimeMet ? (
                          <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-semibold">{tProspects('requisitoAtingido')}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">
                            {tProspects('faltamMeses', { months: HALF_PATCH_REQUIREMENTS.minMonths - stats.monthsAsProspect })}
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        {stats.halfPatchEligible ? (
                          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">{tProspects('elegivelHalfPatch')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <Target className="h-4 w-4" />
                            <span className="text-sm">{tProspects('continueCaminhadaHalf2')}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {/* Half: card Full Patch */}
                  {member.case_type === "Half" && (
                    <>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{tProspects('meritoPontos')}</span>
                          <span className="text-sm font-bold">{stats.totalPoints} / {FULL_PATCH_REQUIREMENTS.minPoints}</span>
                        </div>
                        <Progress value={stats.fullPatchPointsProgress} className="h-3" />
                        {stats.fullPatchPointsMet ? (
                          <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-semibold">{tProspects('requisitoAtingido')}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">
                            {tProspects('faltamPontos', { points: FULL_PATCH_REQUIREMENTS.minPoints - stats.totalPoints })}
                            {renderPenaltyInfo(memberPenalties)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{tProspects('tempoComoHalfMeses')}</span>
                          <span className="text-sm font-bold">{stats.monthsAsHalf} / {FULL_PATCH_REQUIREMENTS.minMonths}</span>
                        </div>
                        <Progress value={stats.fullPatchTimeProgress} className="h-3" />
                        {stats.fullPatchTimeMet ? (
                          <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-semibold">{tProspects('requisitoAtingido')}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">
                            {tProspects('faltamMesesComoHalf', { months: FULL_PATCH_REQUIREMENTS.minMonths - stats.monthsAsHalf })}
                          </div>
                        )}
                        {stats.halfPatchDate && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {tProspects('virouHalfEm')} {format(stats.halfPatchDate, "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        {stats.fullPatchEligible ? (
                          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">{tProspects('elegivelFullPatch')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <Target className="h-4 w-4" />
                            <span className="text-sm">{tProspects('continueCaminhadaFull2')}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Pendências (somente Diretoria) */}
      {isDiretoriaMember && (
        <Dialog open={pendingDialogOpen} onOpenChange={pendingDialogOpen$.set}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{tValidation('pendingDialogTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Atividades pendentes */}
              <div>
                <h3 className="font-semibold mb-2">{tValidation('pendingActivitiesTitle')}</h3>
                {pendingActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {tValidation('noPendingActivities')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{tValidation('prospect')}</TableHead>
                          <TableHead>{tValidation('atividade')}</TableHead>
                          <TableHead>{tValidation('data')}</TableHead>
                          <TableHead>{tValidation('pontos')}</TableHead>
                          <TableHead>{tValidation('descricao')}</TableHead>
                          <TableHead className="w-[120px]">{tValidation('acoes')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingActivities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-medium">
                              {getProspectName(activity.prospect_id)}
                            </TableCell>
                            <TableCell>{getActivityLabel(activity.activity_type)}</TableCell>
                            <TableCell>
                              {activity.activity_date
                                ? format(new Date(activity.activity_date), "dd/MM/yyyy", { locale: ptBR })
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-semibold">
                                +{activity.points} pts
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {activity.description || "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className="gap-1"
                                disabled={actionLoading}
                                onClick={() => handleApproveActivity(activity.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                {tValidation('aprovar')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Penalidades pendentes */}
              <div>
                <h3 className="font-semibold mb-2">{tValidation('pendingPenaltiesTitle')}</h3>
                {pendingPenalties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {tValidation('noPendingPenalties')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{tValidation('prospect')}</TableHead>
                          <TableHead>{tValidation('data')}</TableHead>
                          <TableHead>{tValidation('severidade')}</TableHead>
                          <TableHead>{tValidation('pontos')}</TableHead>
                          <TableHead>{tValidation('descricao')}</TableHead>
                          <TableHead className="w-[120px]">{tValidation('acoes')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingPenalties.map((penalty) => (
                          <TableRow key={penalty.id}>
                            <TableCell className="font-medium">
                              {getProspectName(penalty.prospect_id)}
                            </TableCell>
                            <TableCell>
                              {penalty.created_at
                                ? format(parseISO(penalty.created_at), "dd/MM/yyyy", { locale: ptBR })
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  penalty.severity === "grave"
                                    ? "destructive"
                                    : penalty.severity === "medio"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {penalty.severity === "grave"
                                  ? tProspects('severidadeGrave')
                                  : penalty.severity === "medio"
                                    ? tProspects('severidadeMedia')
                                    : tProspects('severidadeLeve')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive" className="font-semibold">
                                -{penalty.points_deducted} pts
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {penalty.description || penalty.infraction_type || "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className="gap-1"
                                disabled={actionLoading}
                                onClick={() => handleApprovePenalty(penalty.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                {tValidation('aprovar')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Registro */}
      <Dialog open={formDialogOpen} onOpenChange={formDialogOpen$.set}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tValidation('registrarNovaAtividade')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Busca de Prospect */}
            <div className="space-y-2">
              <Label>{tValidation('prospect')} *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={tValidation('buscarProspect')}
                  value={prospectSearch}
                  onChange={(e) => prospectSearch$.set(e.target.value)}
                  className="pl-10"
                />
              </div>
              {prospectSearch && (
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {filteredProspects.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">{tValidation('nenhumProspectEncontrado')}</p>
                  ) : (
                    filteredProspects.map((prospect) => (
                      <button
                        key={prospect.user_id}
                        type="button"
                        onClick={() => {
                          selectedProspect$.set(prospect);
                          prospectSearch$.set(prospect.user_name);
                        }}
                        className={`w-full text-left p-2 hover:bg-muted ${selectedProspect?.user_id === prospect.user_id ? "bg-muted" : ""
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{prospect.user_name}</span>
                          {selectedProspect?.user_id === prospect.user_id && (
                            <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedProspect && (
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{tValidation('selecionado')} {selectedProspect.user_name}</span>
                </div>
              )}
            </div>

            {/* Tipo de Atividade */}
            <div className="space-y-2">
              <Label>{tValidation('tipoAtividade')} *</Label>
              <Select
                value={activityType}
                onValueChange={(value) => activityType$.set(value as ActivityType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tValidation('selecioneTipoAtividade')} />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 text-xs font-semibold text-muted-foreground">
                    {tValidation('pontosMensaisComportamento')}
                  </div>
                  {Object.entries(ACTIVITY_TYPES_CONFIG)
                    .filter(([, config]) => config.monthlyLimit)
                    .map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {tValidation(`activityTypes.${config.key}.label`)} ({config.points} {tValidation('pts')}) - {tValidation('max1xMes')}
                      </SelectItem>
                    ))}
                  <div className="p-2 text-xs font-semibold text-muted-foreground mt-2">
                    {tValidation('pontosPorAtividadesEventos')}
                  </div>
                  {Object.entries(ACTIVITY_TYPES_CONFIG)
                    .filter(([, config]) => !config.monthlyLimit)
                    .map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {tValidation(`activityTypes.${config.key}.label`)} ({config.points} {tValidation('pts')})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {activityType && ACTIVITY_TYPES_CONFIG[activityType] && (
                <p className="text-xs text-muted-foreground">
                  {tValidation(`activityTypes.${ACTIVITY_TYPES_CONFIG[activityType].key}.description`)}
                </p>
              )}
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label>{tValidation('dataAtividade')} *</Label>
              <Input
                type="date"
                value={activityDate}
                onChange={(e) => activityDate$.set(e.target.value)}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label>{tValidation('descricaoOpcional')}</Label>
              <Textarea
                value={description}
                onChange={(e) => description$.set(e.target.value)}
                placeholder={tValidation('adicionarDetalhes')}
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => formDialogOpen$.set(false)}
                disabled={actionLoading}
              >
                {tValidation('cancelar')}
              </Button>
              <Button onClick={handleSubmitActivity} disabled={actionLoading}>
                {actionLoading ? tValidation('registrando') : tValidation('registrarEValidar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Penalidade */}
      <Dialog open={penaltyDialogOpen} onOpenChange={penaltyDialogOpen$.set}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tValidation('incluirPenalidade')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Busca de Prospect */}
            <div className="space-y-2">
              <Label>{tValidation('prospect')} *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={tValidation('buscarProspect')}
                  value={prospectSearch}
                  onChange={(e) => prospectSearch$.set(e.target.value)}
                  className="pl-10"
                />
              </div>
              {prospectSearch && (
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {filteredProspects.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">{tValidation('nenhumProspectEncontrado')}</p>
                  ) : (
                    filteredProspects.map((prospect) => (
                      <button
                        key={prospect.user_id}
                        type="button"
                        onClick={() => {
                          selectedProspect$.set(prospect);
                          prospectSearch$.set(prospect.user_name);
                        }}
                        className={`w-full text-left p-2 hover:bg-muted ${selectedProspect?.user_id === prospect.user_id ? "bg-muted" : ""
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{prospect.user_name}</span>
                          {selectedProspect?.user_id === prospect.user_id && (
                            <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedProspect && (
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{tValidation('selecionado')} {selectedProspect.user_name}</span>
                </div>
              )}
            </div>

            {/* Severidade */}
            <div className="space-y-2">
              <Label>{tValidation('severidadeInfracao')} *</Label>
              <Select
                value={penaltySeverity}
                onValueChange={(value) => penaltySeverity$.set(value as "leve" | "medio" | "grave")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tValidation('selecioneSeveridade')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">{tValidation('severidadeLeve')}</SelectItem>
                  <SelectItem value="medio">{tValidation('severidadeMedia')}</SelectItem>
                  <SelectItem value="grave">{tValidation('severidadeGrave')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label>{tValidation('descricao')}</Label>
              <Textarea
                value={penaltyDescription}
                onChange={(e) => penaltyDescription$.set(e.target.value)}
                placeholder={tValidation('descrevaInfracao')}
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => penaltyDialogOpen$.set(false)}
                disabled={actionLoading}
              >
                {tValidation('cancelar')}
              </Button>
              <Button onClick={handleSubmitPenalty} disabled={actionLoading} variant="destructive">
                {actionLoading ? tValidation('registrandoPenalidade') : tValidation('registrarPenalidadeButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
