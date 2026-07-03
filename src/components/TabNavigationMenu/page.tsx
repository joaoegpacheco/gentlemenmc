"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildTabNavigationStructure,
  isTabInGroup,
  type TabNavEntry,
  type TabNavGroup,
} from "@/lib/tab-navigation-groups";

type TabNavigationMenuProps = {
  tabs: TabNavEntry[];
  activeTab: string;
  onTabChange: (key: string) => void;
};

function NavLink({
  tab,
  active,
  onSelect,
  className,
}: {
  tab: TabNavEntry;
  active: boolean;
  onSelect: (key: string) => void;
  className?: string;
}) {
  return (
    <NavigationMenuLink asChild active={active}>
      <button
        type="button"
        onClick={() => onSelect(tab.key)}
        className={cn(
          "block w-full rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
          active && "bg-accent font-medium text-accent-foreground",
          className
        )}
      >
        {tab.label}
      </button>
    </NavigationMenuLink>
  );
}

function DesktopGroupMenu({
  group,
  groupLabel,
  activeTab,
  onTabChange,
}: {
  group: TabNavGroup;
  groupLabel: string;
  activeTab: string;
  onTabChange: (key: string) => void;
}) {
  const groupActive = isTabInGroup(activeTab, group);

  if (group.items.length === 1) {
    const tab = group.items[0];
    return (
      <NavigationMenuItem>
        <NavigationMenuLink asChild active={activeTab === tab.key}>
          <button
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              navigationMenuTriggerStyle(),
              activeTab === tab.key && "bg-accent text-accent-foreground"
            )}
          >
            {tab.label}
          </button>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn(groupActive && "bg-accent text-accent-foreground")}
      >
        {groupLabel}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[220px] gap-1 p-2">
          {group.items.map((tab) => (
            <li key={tab.key}>
              <NavLink
                tab={tab}
                active={activeTab === tab.key}
                onSelect={onTabChange}
              />
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MobileMenu({
  tabs,
  groups,
  standalone,
  logout,
  activeTab,
  onTabChange,
}: {
  tabs: TabNavEntry[];
  groups: TabNavGroup[];
  standalone: TabNavEntry[];
  logout: TabNavEntry | null;
  activeTab: string;
  onTabChange: (key: string) => void;
}) {
  const t = useTranslations("tabs");
  const [open, setOpen] = useState(false);
  const activeLabel =
    tabs.find((tab) => tab.key === activeTab)?.label ?? t("menu");

  const handleSelect = (key: string) => {
    onTabChange(key);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-full gap-2">
          <Menu className="h-4 w-4 shrink-0" />
          <span className="truncate">{activeLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[70vh] w-[min(92vw,320px)] overflow-y-auto"
      >
        {groups.map((group) => (
          <div key={group.id}>
            <DropdownMenuLabel>{t(`navGroups.${group.id}`)}</DropdownMenuLabel>
            {group.items.map((tab) => (
              <DropdownMenuItem
                key={tab.key}
                onClick={() => handleSelect(tab.key)}
                className={cn(
                  activeTab === tab.key && "bg-accent font-medium"
                )}
              >
                {tab.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}

        {standalone.length > 0 && (
          <>
            {standalone.map((tab) => (
              <DropdownMenuItem
                key={tab.key}
                onClick={() => handleSelect(tab.key)}
                className={cn(
                  activeTab === tab.key && "bg-accent font-medium"
                )}
              >
                {tab.label}
              </DropdownMenuItem>
            ))}
            {logout ? <DropdownMenuSeparator /> : null}
          </>
        )}

        {logout ? (
          <div className="px-1 py-1">{logout.label}</div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TabNavigationMenu({
  tabs,
  activeTab,
  onTabChange,
}: TabNavigationMenuProps) {
  const t = useTranslations("tabs");
  const { groups, standalone, logout } = buildTabNavigationStructure(tabs);

  return (
    <div className="w-full border-b bg-muted/30 px-2 py-2">
      <div className="md:hidden">
        <MobileMenu
          tabs={tabs}
          groups={groups}
          standalone={standalone}
          logout={logout}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      <NavigationMenu
        viewport={false}
        className="mx-auto hidden max-w-none md:flex md:justify-start"
      >
        <NavigationMenuList className="flex-wrap justify-start gap-1">
          {groups.map((group) => (
            <DesktopGroupMenu
              key={group.id}
              group={group}
              groupLabel={t(`navGroups.${group.id}`)}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          ))}

          {standalone.map((tab) => (
            <NavigationMenuItem key={tab.key}>
              <NavigationMenuLink asChild active={activeTab === tab.key}>
                <button
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    activeTab === tab.key &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  {tab.label}
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}

          {logout ? (
            <NavigationMenuItem className="ml-auto">
              {logout.label}
            </NavigationMenuItem>
          ) : null}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
