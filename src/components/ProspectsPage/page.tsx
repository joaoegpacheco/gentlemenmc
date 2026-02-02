"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { message } from "@/lib/message";
import { supabase } from "@/hooks/use-supabase";
import {
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Target,
  Activity,
} from "lucide-react";
import type { SupabaseAuthUser } from "@/types/auth";
import { format, differenceInMonths, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface Member {
  user_id: string;
  user_name: string;
  user_email?: string;
  foto_url?: string;
  case_type?: string;
  created_at?: string;
  half_date?: string;
}

// Tipos de atividades serão traduzidos dinamicamente
const ACTIVITY_TYPE_KEYS = {
  "presenca_proatividade": "presencaProatividade",
  "rodar_2_fds": "rodar2Fds",
  "open_house_outros_mc": "openHouseOutrosMc",
  "acoes_filantropicas": "acoesFilantropicas",
  "viajar_com_clube": "viajarComClube",
  "viajar_sem_clube": "viajarSemClube",
  "organizar_open_house": "organizarOpenHouse",
} as const;

// Requisitos
const HALF_PATCH_REQUIREMENTS = {
  minMonths: 6, // 6 meses como Prospect
  minPoints: 100,
};

const FULL_PATCH_REQUIREMENTS = {
  minMonths: 6, // 6 meses como Half Patch
  minPoints: 150,
};

export function ProspectsPage() {
  const t = useTranslations('common');
  const tProspects = useTranslations('prospectsPage');
  const loading$ = useObservable(true);
  const member$ = useObservable<Member | null>(null);
  const activities$ = useObservable<ProspectActivity[]>([]);

  const loading = useValue(loading$);
  const member = useValue(member$);
  const activities = useValue(activities$);
  const router = useRouter();

  const fetchProspectData = useCallback(async () => {
    loading$.set(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user as SupabaseAuthUser | null;

      if (!user) {
        router.push("/");
        return;
      }

      // Buscar dados do membro
      const { data: memberData, error: memberError } = await supabase
        .from("membros")
        .select("user_id, user_name, user_email, foto_url, case_type, created_at, half_date")
        .eq("user_id", user.id)
        .single();

      if (memberError) {
        console.error("Erro ao buscar dados do membro:", memberError);
        message.error(tProspects('errorLoading'));
        return;
      }

      member$.set(memberData);

      // Buscar atividades do prospect
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("prospect_activities")
        .select("*")
        .eq("prospect_id", user.id)
        .order("activity_date", { ascending: false });

      if (activitiesError) {
        if (activitiesError.code !== "42P01" && !activitiesError.message?.includes("does not exist")) {
          console.error("Erro ao buscar atividades:", activitiesError);
        }
        activities$.set([]);
      } else {
        activities$.set(activitiesData || []);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      message.error(tProspects('errorLoading'));
    } finally {
      loading$.set(false);
    }
  }, [router, activities$, loading$, member$, tProspects]);

  useEffect(() => {
    fetchProspectData();
  }, [fetchProspectData]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!member || !activities) {
      return null;
    }

    const startDate = member.created_at ? parseISO(member.created_at) : new Date();
    const monthsAsProspect = differenceInMonths(new Date(), startDate);
    const daysAsProspect = differenceInDays(new Date(), startDate);

    // Calcular pontos totais (apenas atividades validadas)
    const totalPoints = activities
      .filter((a) => a.status === "validated")
      .reduce((sum, a) => sum + a.points, 0);

    // Verificar requisitos Half Patch
    const halfPatchPointsProgress = Math.min((totalPoints / HALF_PATCH_REQUIREMENTS.minPoints) * 100, 100);
    const halfPatchTimeProgress = Math.min((monthsAsProspect / HALF_PATCH_REQUIREMENTS.minMonths) * 100, 100);
    const halfPatchPointsMet = totalPoints >= HALF_PATCH_REQUIREMENTS.minPoints;
    const halfPatchTimeMet = monthsAsProspect >= HALF_PATCH_REQUIREMENTS.minMonths;
    const halfPatchEligible = halfPatchPointsMet && halfPatchTimeMet;

    // Verificar requisitos Full Patch
    // Se já é Half, usar half_date da tabela membros ou calcular a partir das atividades
    const isHalf = member.case_type === "Half";
    let halfPatchDate: Date | null = null;
    if (isHalf) {
      if (member.half_date) {
        halfPatchDate = parseISO(member.half_date);
      } else {
        // Fallback: calcular pela lógica de atividades (100 pts + 6 meses)
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
    
    // Calcular tempo como Half Patch
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

    // Atividades por mês (últimos 6 meses)
    const activitiesByMonth: Record<string, number> = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    activities
      .filter((a) => a.status === "validated" && new Date(a.activity_date) >= sixMonthsAgo)
      .forEach((activity) => {
        const monthKey = format(parseISO(activity.activity_date), "yyyy-MM", { locale: ptBR });
        activitiesByMonth[monthKey] = (activitiesByMonth[monthKey] || 0) + activity.points;
      });

    return {
      startDate,
      monthsAsProspect,
      daysAsProspect,
      totalPoints,
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
      activitiesByMonth,
      monthsAsHalf,
      halfPatchDate,
    };
  }, [member, activities]);

  const getActivityLabel = (type: string) => {
    const key = ACTIVITY_TYPE_KEYS[type as keyof typeof ACTIVITY_TYPE_KEYS];
    if (key) {
      try {
        return tProspects(`activityTypes.${key}.label`);
      } catch {
        return type;
      }
    }
    return type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">{tProspects('loading')}</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">{tProspects('errorLoading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header do Prospect */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6 flex-wrap">
            <div>
              {member.foto_url ? (
                <Image
                  src={member.foto_url}
                  alt={member.user_name}
                  width={96}
                  height={96}
                  className="object-cover rounded-full w-24 h-24 border-2"
                  priority
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2">
                  <span className="text-4xl font-bold">
                    {member.user_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{member.user_name}</h1>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {member.case_type === "Half" ? tProspects('halfPatch') : tProspects('prospect')}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {member.created_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {tProspects('estradaDesde')} {format(parseISO(member.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {member.case_type === "Half" 
                      ? `${stats.monthsAsProspect} ${stats.monthsAsProspect === 1 ? "mês" : "meses"} como Half Patch`
                      : `${stats.monthsAsProspect} ${stats.monthsAsProspect === 1 ? "mês" : "meses"} como prospect`
                    }
                    ({stats.daysAsProspect} {stats.daysAsProspect === 1 ? "dia" : "dias"})
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{stats.totalPoints}</div>
              <div className="text-sm text-muted-foreground">{tProspects('pontosTotais')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status da Caminhada */}
      <div className={`grid gap-6 ${member.case_type === "Half" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
        {/* Half Patch - Mostrar apenas se for Prospect */}
        {member.case_type !== "Half" && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {tProspects('halfPatchTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pontos */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Mérito (Pontos)</span>
                <span className="text-sm font-bold">
                  {stats.totalPoints} / {HALF_PATCH_REQUIREMENTS.minPoints}
                </span>
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
                </div>
              )}
            </div>

            {/* Tempo */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{tProspects('tempoCasaMeses')}</span>
                <span className="text-sm font-bold">
                  {stats.monthsAsProspect} / {HALF_PATCH_REQUIREMENTS.minMonths}
                </span>
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

            {/* Status Geral */}
            <div className="pt-4 border-t">
              {stats.halfPatchEligible ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {tProspects('elegivelHalfPatch')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Target className="h-5 w-5" />
                  <span className="text-sm">
                    {tProspects('continueCaminhadaHalf')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          </Card>
        )}

        {/* Full Patch - Mostrar apenas se for Half */}
        {member.case_type === "Half" && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {tProspects('fullPatchTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pontos */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Mérito (Pontos)</span>
                <span className="text-sm font-bold">
                  {stats.totalPoints} / {FULL_PATCH_REQUIREMENTS.minPoints}
                </span>
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
                </div>
              )}
            </div>

            {/* Tempo */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{tProspects('tempoComoHalfMeses')}</span>
                <span className="text-sm font-bold">
                  {member.case_type === "Half"
                    ? `${stats.monthsAsHalf} / ${FULL_PATCH_REQUIREMENTS.minMonths}`
                    : stats.halfPatchEligible
                    ? `${stats.monthsAsHalf} / ${FULL_PATCH_REQUIREMENTS.minMonths}`
                    : "0 / 6"}
                </span>
              </div>
              <Progress value={stats.fullPatchTimeProgress} className="h-3" />
              {member.case_type === "Half" ? (
                stats.fullPatchTimeMet ? (
                  <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-semibold">{tProspects('requisitoAtingido')}</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    {tProspects('faltamMesesComoHalf', { months: FULL_PATCH_REQUIREMENTS.minMonths - stats.monthsAsHalf })}
                  </div>
                )
              ) : !stats.halfPatchEligible ? (
                <div className="text-xs text-muted-foreground mt-1">
                  {tProspects('alcanceHalfPrimeiro')}
                </div>
              ) : stats.fullPatchTimeMet ? (
                <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-semibold">{tProspects('requisitoAtingido')}</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-1">
                  Faltam {FULL_PATCH_REQUIREMENTS.minMonths - stats.monthsAsHalf} meses como Half
                </div>
              )}
              {member.case_type === "Half" && stats.halfPatchDate && (
                <div className="text-xs text-muted-foreground mt-2">
                  {tProspects('virouHalfEm')} {format(stats.halfPatchDate, "dd/MM/yyyy", { locale: ptBR })}
                </div>
              )}
            </div>

            {/* Status Geral */}
            <div className="pt-4 border-t">
              {stats.fullPatchEligible ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {tProspects('elegivelFullPatch')}
                  </span>
                </div>
              ) : member.case_type === "Half" ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Target className="h-5 w-5" />
                  <span className="text-sm">
                    Continue sua caminhada para alcançar o Full Patch
                  </span>
                </div>
              ) : !stats.halfPatchEligible ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Target className="h-5 w-5" />
                  <span className="text-sm">
                    Alcance o Half Patch primeiro
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Target className="h-5 w-5" />
                  <span className="text-sm">
                    Continue sua caminhada para alcançar o Full Patch
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          </Card>
        )}
      </div>

      {/* Histórico de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {tProspects('historicoAtividades')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tProspects('nenhumaAtividade')}</p>
              <p className="text-sm mt-2">{tProspects('atividadesAparecerao')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tProspects('data')}</TableHead>
                    <TableHead>{tProspects('atividade')}</TableHead>
                    <TableHead>{tProspects('pontos')}</TableHead>
                    <TableHead>{tProspects('descricao')}</TableHead>
                    <TableHead>{tProspects('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        {activity.activity_date
                          ? format(parseISO(activity.activity_date), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getActivityLabel(activity.activity_type)}
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
                        {activity.status === "validated" ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Validado
                          </Badge>
                        ) : activity.status === "rejected" ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejeitado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
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

      {/* Resumo Mensal (últimos 6 meses) */}
      {Object.keys(stats.activitiesByMonth).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {tProspects('evolucaoMensal')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.activitiesByMonth)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, points]) => {
                  const monthDate = parseISO(`${month}-01`);
                  return (
                    <div key={month} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">
                        {format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex-1">
                        <Progress value={Math.min((points / 50) * 100, 100)} className="h-2" />
                      </div>
                      <div className="w-20 text-right text-sm font-semibold">
                        {points} pts
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
