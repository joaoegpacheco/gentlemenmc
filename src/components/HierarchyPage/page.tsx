"use client";

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowRight } from "lucide-react";
import { supabase } from "@/hooks/use-supabase";
import { RemoteImage } from "@/components/ui/remote-image";
import {
  CLUB_HIERARCHY,
  HIERARCHY_SECTION_ORDER,
  findMemberByHierarchyName,
  type HierarchyEntry,
  type HierarchySectionId,
} from "@/lib/club-hierarchy";
import { cn } from "@/lib/utils";

const BOARD_CARD_WIDTH_PX = 120; // 7.5rem
const BOARD_GAP_X_PX = 16; // gap-x-4

function chunkMembers<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

type MemberRow = {
  id: number;
  user_name: string;
  foto_url: string | null;
  status: string | null;
};

type HierarchyMember = HierarchyEntry & {
  foto_url: string | null;
};

function HierarchyCard({
  member,
  size = "md",
  compact = false,
}: {
  member: HierarchyMember;
  size?: "lg" | "md" | "sm";
  compact?: boolean;
}) {
  const sizeClasses = {
    lg: "w-28 h-28 sm:w-32 sm:h-32",
    md: compact
      ? "w-24 h-24 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 2xl:w-32 2xl:h-32"
      : "w-24 h-24",
    sm: "w-20 h-20",
  } as const;

  const initial = member.displayName.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 text-center",
        compact
          ? "w-[7.5rem] self-start sm:min-w-0 sm:w-auto sm:max-w-[7rem] sm:flex-1 md:max-w-[8rem] lg:max-w-[9rem] xl:max-w-[10rem] 2xl:max-w-[11rem]"
          : "w-[7.5rem] sm:w-36"
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted shadow-sm",
          sizeClasses[size]
        )}
      >
        {member.foto_url ? (
          <RemoteImage
            src={member.foto_url}
            alt={member.displayName}
            fill
            className="object-cover"
            sizes={
              compact
                ? "(min-width: 1536px) 128px, (min-width: 1280px) 112px, (min-width: 1024px) 96px, (min-width: 768px) 80px, 96px"
                : "128px"
            }
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center font-semibold text-muted-foreground",
              compact
                ? "text-2xl sm:text-base md:text-lg lg:text-xl xl:text-2xl"
                : "text-2xl"
            )}
          >
            {initial}
          </div>
        )}
      </div>
      <div
        className={cn(
          "flex w-full flex-col items-center gap-0.5 leading-snug",
          compact ? "px-1 sm:px-0.5" : "px-1"
        )}
      >
        <p
          className={cn(
            "w-full font-semibold",
            compact
              ? "min-h-5 text-sm sm:min-h-[1.25rem] sm:text-[11px] md:text-xs lg:text-sm"
              : "min-h-5 text-sm"
          )}
        >
          {member.displayName}
        </p>
        <p
          className={cn(
            "w-full text-muted-foreground",
            compact
              ? "min-h-8 text-xs sm:min-h-[2.5rem] sm:text-[11px] md:text-xs lg:text-sm"
              : "min-h-8 text-xs"
          )}
        >
          {member.role}
        </p>
      </div>
    </div>
  );
}

function SectionConnector() {
  return (
    <div className="flex justify-center py-2" aria-hidden>
      <div className="h-6 w-px bg-border" />
    </div>
  );
}

function HierarchyBoardFlow({
  members,
  size = "md",
}: {
  members: HierarchyMember[];
  size?: "lg" | "md" | "sm";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [perRow, setPerRow] = useState(2);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updatePerRow = () => {
      const width = container.clientWidth;
      const next = Math.max(
        1,
        Math.floor(
          (width + BOARD_GAP_X_PX) / (BOARD_CARD_WIDTH_PX + BOARD_GAP_X_PX)
        )
      );
      setPerRow((prev) => (prev === next ? prev : next));
    };

    updatePerRow();
    const observer = new ResizeObserver(updatePerRow);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const rows = chunkMembers(members, perRow);

  return (
    <>
      <div
        ref={containerRef}
        className="flex w-full flex-col items-center gap-3 sm:hidden"
      >
        {rows.map((row, rowIndex) => (
          <Fragment key={`board-row-${rowIndex}`}>
            <div className="flex items-start justify-center gap-x-4">
              {row.map((member, index) => (
                <Fragment key={`${member.section}-${member.displayName}`}>
                  <HierarchyCard member={member} size={size} compact />
                  {index < row.length - 1 ? (
                    <ArrowRight
                      className="mt-6 h-3.5 w-3.5 shrink-0 self-start text-muted-foreground"
                      aria-hidden
                    />
                  ) : null}
                </Fragment>
              ))}
            </div>
            {rowIndex < rows.length - 1 ? (
              <ArrowDown
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-hidden
              />
            ) : null}
          </Fragment>
        ))}
      </div>

      <div className="hidden w-full items-start justify-between gap-1 md:gap-2 sm:flex">
        {members.map((member, index) => (
          <Fragment key={`${member.section}-${member.displayName}`}>
            <HierarchyCard member={member} size={size} compact />
            {index < members.length - 1 ? (
              <ArrowRight
                className="mt-6 h-3.5 w-3.5 shrink-0 self-start text-muted-foreground md:mt-8 md:h-4 md:w-4 lg:mt-10 lg:h-4 lg:w-4 xl:mt-12"
                aria-hidden
              />
            ) : null}
          </Fragment>
        ))}
      </div>
    </>
  );
}

function HierarchySection({
  title,
  description,
  members,
  size = "md",
  columns,
  showHierarchyArrows = false,
}: {
  title: string;
  description?: string;
  members: HierarchyMember[];
  size?: "lg" | "md" | "sm";
  columns?: string;
  showHierarchyArrows?: boolean;
}) {
  if (members.length === 0) return null;

  return (
    <section className="w-full">
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {showHierarchyArrows ? (
        <HierarchyBoardFlow members={members} size={size} />
      ) : (
        <div
          className={cn(
            "flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-6",
            columns
          )}
        >
          {members.map((member) => (
            <HierarchyCard
              key={`${member.section}-${member.displayName}`}
              member={member}
              size={size}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HierarchyPage() {
  const t = useTranslations("hierarchy");
  const [members, setMembers] = useState<HierarchyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("membros")
        .select("id, user_name, foto_url, status")
        .eq("status", "ativo");

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setMembers(
          CLUB_HIERARCHY.map((entry) => ({ ...entry, foto_url: null }))
        );
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as MemberRow[];
      const resolved = CLUB_HIERARCHY.map((entry) => {
        const match = findMemberByHierarchyName(rows, entry);
        return {
          ...entry,
          foto_url: match?.foto_url ?? null,
        };
      });

      setMembers(resolved);
      setLoading(false);
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  const bySection = HIERARCHY_SECTION_ORDER.reduce(
    (acc, section) => {
      acc[section] = members.filter((member) => member.section === section);
      return acc;
    },
    {} as Record<HierarchySectionId, HierarchyMember[]>
  );

  const president = bySection.presidency[0];
  const vicePresident = bySection.presidency[1];

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("loading")}
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-2 py-4 sm:px-4">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {error ? (
        <p className="mb-4 text-center text-sm text-destructive">{t("loadError")}</p>
      ) : null}

      {president ? (
        <div className="flex w-full flex-col items-center">
          <HierarchyCard member={president} size="lg" />
          {vicePresident ? <SectionConnector /> : null}
        </div>
      ) : null}

      {vicePresident ? (
        <div className="flex w-full flex-col items-center">
          <HierarchyCard member={vicePresident} size="lg" />
          <SectionConnector />
        </div>
      ) : null}

      <HierarchySection
        title={t("sections.board")}
        description={t("sections.boardDescription")}
        members={bySection.board}
        size="md"
        showHierarchyArrows
      />

      {bySection.roles.length > 0 ? <SectionConnector /> : null}

      <HierarchySection
        title={t("sections.roles")}
        description={t("sections.rolesDescription")}
        members={bySection.roles}
        size="md"
      />

      {bySection.fullPatch.length > 0 ? <SectionConnector /> : null}

      <HierarchySection
        title={t("sections.fullPatch")}
        description={t("sections.fullPatchDescription")}
        members={bySection.fullPatch}
        size="sm"
      />

      {bySection.halfPatch.length > 0 ? <SectionConnector /> : null}

      <HierarchySection
        title={t("sections.halfPatch")}
        description={t("sections.halfPatchDescription")}
        members={bySection.halfPatch}
        size="sm"
      />

      {bySection.prospectPp.length > 0 ? <SectionConnector /> : null}

      <HierarchySection
        title={t("sections.prospectPp")}
        description={t("sections.prospectPpDescription")}
        members={bySection.prospectPp}
        size="sm"
      />
    </div>
  );
}
