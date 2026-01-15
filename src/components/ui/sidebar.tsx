'use client';

import React, { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Button } from './button';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
  items?: SidebarItem[]; // For sub-items
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  header?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
}

/**
 * Sidebar Navigation Component
 */
export function Sidebar({
  sections,
  header,
  footer,
  collapsed = false,
  onCollapse,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      {header && (
        <div className="p-4 border-b">
          {!collapsed && header}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {sections.map((section, sectionIndex) => (
          <div key={`section-${sectionIndex}`} className="mb-4">
            {section.title && !collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <SidebarNavItem
                  key={`${item.href}-${itemIndex}`}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="p-4 border-t">
          {!collapsed && footer}
        </div>
      )}
    </aside>
  );
}

/**
 * Sidebar Navigation Item
 */
function SidebarNavItem({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasSubItems = item.items && item.items.length > 0;
  const isActive = pathname ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;

  const Icon = item.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (hasSubItems) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <li>
      <Link
        href={item.href}
        onClick={handleClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-accent text-accent-foreground',
          collapsed && 'justify-center'
        )}
        title={collapsed ? item.label : undefined}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {item.badge}
              </span>
            )}
            {hasSubItems && (
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </>
        )}
      </Link>

      {/* Sub-items */}
      {hasSubItems && !collapsed && isExpanded && (
        <ul className="ml-8 mt-1 space-y-1">
          {item.items!.map((subItem, subIndex) => (
            <li key={`${subItem.href}-${subIndex}`}>
              <Link
                href={subItem.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  pathname === subItem.href && 'bg-accent text-accent-foreground'
                )}
              >
                {subItem.icon && <subItem.icon className="h-4 w-4" />}
                <span>{subItem.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Collapsible Sidebar with toggle button
 */
export function CollapsibleSidebar(props: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(props.collapsed || false);

  return (
    <>
      <Sidebar
        {...props}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 -right-4 z-10"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 transition-transform',
            collapsed && 'rotate-180'
          )}
        />
      </Button>
    </>
  );
}

