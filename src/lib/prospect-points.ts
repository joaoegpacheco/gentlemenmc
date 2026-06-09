import { differenceInMonths, isBefore, parseISO, startOfDay } from "date-fns";

export const HALF_PATCH_REQUIREMENTS = { minMonths: 6, minPoints: 100 };
export const FULL_PATCH_REQUIREMENTS = { minMonths: 6, minPoints: 150 };

export interface ProspectMemberForStats {
  created_at?: string;
  case_type?: string | null;
  half_date?: string | null;
}

export interface ProspectActivityForStats {
  status: string;
  points: number;
  activity_date: string;
}

export interface ProspectPenaltyForStats {
  status?: string;
  points_deducted: number;
  created_at?: string;
}

export interface ProspectStats {
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
  penaltyDeduction: number;
}

function isOnOrAfterHalfDate(dateStr: string | undefined, halfDate: Date): boolean {
  if (!dateStr) return false;
  return !isBefore(startOfDay(parseISO(dateStr)), startOfDay(halfDate));
}

function filterFromHalfDate<T>(
  items: T[],
  getDate: (item: T) => string | undefined,
  halfDate: Date
): T[] {
  return items.filter((item) => isOnOrAfterHalfDate(getDate(item), halfDate));
}

export function resolveHalfPatchDate(
  member: ProspectMemberForStats,
  validatedActivities: ProspectActivityForStats[]
): Date | null {
  if (member.case_type !== "Half") return null;

  if (member.half_date) {
    return parseISO(member.half_date);
  }

  const startDate = member.created_at ? parseISO(member.created_at) : new Date();
  const sortedActivities = [...validatedActivities].sort(
    (a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime()
  );

  let accumulatedPoints = 0;
  for (const activity of sortedActivities) {
    accumulatedPoints += activity.points;
    const activityDate = parseISO(activity.activity_date);
    const monthsSinceStart = differenceInMonths(activityDate, startDate);
    if (
      accumulatedPoints >= HALF_PATCH_REQUIREMENTS.minPoints &&
      monthsSinceStart >= HALF_PATCH_REQUIREMENTS.minMonths
    ) {
      return activityDate;
    }
  }

  const minHalfDate = new Date(startDate);
  minHalfDate.setMonth(minHalfDate.getMonth() + HALF_PATCH_REQUIREMENTS.minMonths);
  return minHalfDate;
}

export function computeProspectStats(
  member: ProspectMemberForStats,
  activities: ProspectActivityForStats[],
  penalties: ProspectPenaltyForStats[] = []
): ProspectStats {
  const startDate = member.created_at ? parseISO(member.created_at) : new Date();
  const monthsAsProspect = differenceInMonths(new Date(), startDate);
  const isHalf = member.case_type === "Half";

  const validatedActivities = activities.filter((a) => a.status === "validated");
  const validatedPenalties = penalties.filter((p) => p.status === "validated");
  const halfPatchDate = resolveHalfPatchDate(member, validatedActivities);

  const countingActivities =
    isHalf && halfPatchDate
      ? filterFromHalfDate(validatedActivities, (a) => a.activity_date, halfPatchDate)
      : validatedActivities;
  const countingPenalties =
    isHalf && halfPatchDate
      ? filterFromHalfDate(validatedPenalties, (p) => p.created_at, halfPatchDate)
      : validatedPenalties;

  const activityPoints = countingActivities.reduce((sum, a) => sum + a.points, 0);
  const penaltyDeduction = countingPenalties.reduce(
    (sum, p) => sum + Math.abs(p.points_deducted),
    0
  );
  const totalPoints = Math.max(0, activityPoints - penaltyDeduction);

  const halfPatchPointsProgress = Math.min(
    (totalPoints / HALF_PATCH_REQUIREMENTS.minPoints) * 100,
    100
  );
  const halfPatchTimeProgress = Math.min(
    (monthsAsProspect / HALF_PATCH_REQUIREMENTS.minMonths) * 100,
    100
  );
  const halfPatchPointsMet = totalPoints >= HALF_PATCH_REQUIREMENTS.minPoints;
  const halfPatchTimeMet = monthsAsProspect >= HALF_PATCH_REQUIREMENTS.minMonths;
  const halfPatchEligible = halfPatchPointsMet && halfPatchTimeMet;

  const monthsAsHalf = halfPatchDate
    ? differenceInMonths(new Date(), halfPatchDate)
    : halfPatchEligible
      ? Math.max(0, monthsAsProspect - HALF_PATCH_REQUIREMENTS.minMonths)
      : 0;

  const fullPatchPointsProgress = Math.min(
    (totalPoints / FULL_PATCH_REQUIREMENTS.minPoints) * 100,
    100
  );
  const fullPatchTimeProgress = Math.min(
    (monthsAsHalf / FULL_PATCH_REQUIREMENTS.minMonths) * 100,
    100
  );
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
    penaltyDeduction,
  };
}

export function countProspectPoints(
  member: ProspectMemberForStats,
  activities: ProspectActivityForStats[],
  penalties: ProspectPenaltyForStats[] = []
): number {
  return computeProspectStats(member, activities, penalties).totalPoints;
}
