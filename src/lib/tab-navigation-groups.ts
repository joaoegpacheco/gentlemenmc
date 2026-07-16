import type { ReactNode } from "react";

export type TabNavGroupId =
  | "marking"
  | "orders"
  | "financial"
  | "stock"
  | "club"
  | "admin";

export const TAB_NAV_GROUP_ORDER: TabNavGroupId[] = [
  "marking",
  "orders",
  "financial",
  "stock",
  "club",
  "admin",
];

export const TAB_NAV_GROUP_KEYS: Record<TabNavGroupId, string[]> = {
  marking: ["1", "2", "22"],
  orders: ["12", "13", "17"],
  financial: ["9", "10", "23"],
  stock: ["16", "24", "14", "25", "15"],
  club: ["5", "6", "27", "26", "21"],
  admin: ["18", "20"],
};

export const TAB_NAV_LOGOUT_KEY = "11";

export type TabNavEntry = {
  key: string;
  label: ReactNode;
};

export type TabNavGroup = {
  id: TabNavGroupId;
  items: TabNavEntry[];
};

export function buildTabNavigationStructure(
  tabs: TabNavEntry[]
): {
  groups: TabNavGroup[];
  standalone: TabNavEntry[];
  logout: TabNavEntry | null;
} {
  const contentTabs = tabs.filter((tab) => tab.key !== TAB_NAV_LOGOUT_KEY);
  const logout =
    tabs.find((tab) => tab.key === TAB_NAV_LOGOUT_KEY) ?? null;

  const assignedKeys = new Set<string>();
  const groups: TabNavGroup[] = [];

  for (const groupId of TAB_NAV_GROUP_ORDER) {
    const keys = TAB_NAV_GROUP_KEYS[groupId];
    const items = keys
      .map((key) => contentTabs.find((tab) => tab.key === key))
      .filter((tab): tab is TabNavEntry => Boolean(tab));

    items.forEach((item) => assignedKeys.add(item.key));

    if (items.length > 0) {
      groups.push({ id: groupId, items });
    }
  }

  const standalone = contentTabs.filter((tab) => !assignedKeys.has(tab.key));

  return { groups, standalone, logout };
}

export function isTabInGroup(
  activeTab: string,
  group: TabNavGroup
): boolean {
  return group.items.some((item) => item.key === activeTab);
}
