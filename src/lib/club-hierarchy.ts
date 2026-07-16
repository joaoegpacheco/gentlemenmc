export type HierarchySectionId =
  | "presidency"
  | "board"
  | "roles"
  | "fullPatch"
  | "halfPatch"
  | "prospectPp";

export type HierarchyEntry = {
  /** Display name shown in the organogram */
  displayName: string;
  /** Role / cargo label under the name */
  role: string;
  /** Alternative names used to match `membros.user_name` */
  matchNames: string[];
  section: HierarchySectionId;
};

/**
 * Official club hierarchy order.
 * Photos are resolved at runtime from the `membros` table via name matching.
 */
export const CLUB_HIERARCHY: HierarchyEntry[] = [
  {
    displayName: "Alex",
    role: "President NOMAD",
    matchNames: ["Alex", "Alex"],
    section: "presidency",
  },
  {
    displayName: "Weriton",
    role: "Vice President",
    matchNames: ["Weriton"],
    section: "presidency",
  },
  {
    displayName: "Soares",
    role: "Sgt at Arms",
    matchNames: ["Soares"],
    section: "board",
  },
  {
    displayName: "Mortari",
    role: "Treasurer NOMAD",
    matchNames: ["Mortari"],
    section: "board",
  },
  {
    displayName: "Jefão",
    role: "Secretary",
    matchNames: ["Jefão", "Jefao"],
    section: "board",
  },
  {
    displayName: "Gulitich",
    role: "Road Captain",
    matchNames: ["Gulitich"],
    section: "board",
  },
  {
    displayName: "Rafael",
    role: "Lawyer",
    matchNames: ["Rafael"],
    section: "board",
  },
  {
    displayName: "Fernando",
    role: "Philantropy NOMAD",
    matchNames: ["Fernando"],
    section: "board",
  },
  {
    displayName: "Robson",
    role: "HQ Manager",
    matchNames: ["Robson"],
    section: "roles",
  },
  {
    displayName: "Zeca",
    role: "Local Tour",
    matchNames: ["Zeca"],
    section: "roles",
  },
  {
    displayName: "André",
    role: "Full Patch",
    matchNames: ["André", "Andre"],
    section: "fullPatch",
  },
  {
    displayName: "Athayde",
    role: "Full Patch",
    matchNames: ["Athayde"],
    section: "fullPatch",
  },
  {
    displayName: "Bacellar",
    role: "Full Patch",
    matchNames: ["Bacellar"],
    section: "fullPatch",
  },
  {
    displayName: "Baeza",
    role: "Full Patch",
    matchNames: ["Baeza"],
    section: "fullPatch",
  },
  {
    displayName: "Beto",
    role: "Full Patch NOMAD",
    matchNames: ["Beto"],
    section: "fullPatch",
  },
  {
    displayName: "Claudio",
    role: "Full Patch",
    matchNames: ["Claudio"],
    section: "fullPatch",
  },
  {
    displayName: "Eduardo Camargo",
    role: "Full Patch",
    matchNames: ["Eduardo Camargo", "Camargo"],
    section: "fullPatch",
  },
  {
    displayName: "Fagner",
    role: "Full Patch",
    matchNames: ["Fagner"],
    section: "fullPatch",
  },
  {
    displayName: "Índio",
    role: "Full Patch",
    matchNames: ["Índio", "Indio"],
    section: "fullPatch",
  },
  {
    displayName: "Jeferson",
    role: "Full Patch",
    matchNames: ["Jeferson"],
    section: "fullPatch",
  },
  {
    displayName: "Léo",
    role: "Full Patch",
    matchNames: ["Léo", "Leo"],
    section: "fullPatch",
  },
  {
    displayName: "Madalosso",
    role: "Full Patch",
    matchNames: ["Madalosso"],
    section: "fullPatch",
  },
  {
    displayName: "Mega",
    role: "Full Patch",
    matchNames: ["Mega"],
    section: "fullPatch",
  },
  {
    displayName: "Muller",
    role: "Full Patch",
    matchNames: ["Muller", "Müller", "Dani"],
    section: "fullPatch",
  },
  {
    displayName: "Pacheco",
    role: "Full Patch",
    matchNames: ["Pacheco"],
    section: "fullPatch",
  },
  {
    displayName: "Rick",
    role: "Full Patch",
    matchNames: ["Rick"],
    section: "fullPatch",
  },
  {
    displayName: "Rodrigo ND",
    role: "Full Patch",
    matchNames: ["Rodrigo ND", "Rodrigo N.D", "Rodrigo N.D.", "Rodrigo"],
    section: "fullPatch",
  },
  {
    displayName: "Rogério",
    role: "Full Patch",
    matchNames: ["Rogério", "Rogerio"],
    section: "fullPatch",
  },
  {
    displayName: "Tuti",
    role: "Full Patch",
    matchNames: ["Tuti"],
    section: "fullPatch",
  },
  {
    displayName: "Zanona",
    role: "Full Patch",
    matchNames: ["Zanona"],
    section: "fullPatch",
  },
  {
    displayName: "Zé Carlos",
    role: "Full Patch",
    matchNames: ["Zé Carlos", "Ze Carlos"],
    section: "fullPatch",
  },
  {
    displayName: "Zorek",
    role: "Full Patch",
    matchNames: ["Zorek"],
    section: "fullPatch",
  },
  {
    displayName: "Benício",
    role: "Prospect Half Patch (Accountant)",
    matchNames: ["Benício", "Benicio", "Beni"],
    section: "halfPatch",
  },
  {
    displayName: "Guiotto",
    role: "Prospect Half Patch (Buyer)",
    matchNames: ["Guiotto"],
    section: "halfPatch",
  },
  {
    displayName: "Julio",
    role: "Prospect Half Patch",
    matchNames: ["Julio", "Julinho"],
    section: "halfPatch",
  },
  {
    displayName: "Roberto",
    role: "Prospect Half Patch",
    matchNames: ["Roberto"],
    section: "halfPatch",
  },
  {
    displayName: "Anderson",
    role: "Prospect PP",
    matchNames: ["Anderson"],
    section: "prospectPp",
  },
  {
    displayName: "Eliezer",
    role: "Prospect PP",
    matchNames: ["Eliezer"],
    section: "prospectPp",
  },
  {
    displayName: "Francisco",
    role: "Prospect PP",
    matchNames: ["Francisco"],
    section: "prospectPp",
  },
  {
    displayName: "Gunha",
    role: "Prospect PP",
    matchNames: ["Gunha"],
    section: "prospectPp",
  },
];

export const HIERARCHY_SECTION_ORDER: HierarchySectionId[] = [
  "presidency",
  "board",
  "roles",
  "fullPatch",
  "halfPatch",
  "prospectPp",
];

export function normalizeMemberName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findMemberByHierarchyName<T extends { user_name: string }>(
  members: T[],
  entry: HierarchyEntry
): T | undefined {
  const candidates = entry.matchNames.map(normalizeMemberName);

  return members.find((member) => {
    const normalized = normalizeMemberName(member.user_name);
    return candidates.some(
      (candidate) =>
        normalized === candidate ||
        normalized.startsWith(`${candidate} `) ||
        candidate.startsWith(`${normalized} `)
    );
  });
}
