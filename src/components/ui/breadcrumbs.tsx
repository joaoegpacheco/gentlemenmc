'use client';

import React, { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: ReactNode;
  showHome?: boolean;
  className?: string;
}

/**
 * Breadcrumbs Navigation Component
 * Automatically generates breadcrumbs from pathname or uses custom items
 */
export function Breadcrumbs({
  items,
  separator = <ChevronRight className="h-4 w-4" />,
  showHome = true,
  className,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname if no items provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname || '');

  // Add home item if enabled
  const allItems = showHome
    ? [{ label: 'Início', href: '/', icon: <Home className="h-4 w-4" /> }, ...breadcrumbItems]
    : breadcrumbItems;

  if (allItems.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-2 text-sm', className)}>
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={`${item.href}-${index}`} className="flex items-center space-x-2">
              {index > 0 && (
                <span className="text-muted-foreground" aria-hidden="true">
                  {separator}
                </span>
              )}
              {isLast ? (
                <span
                  className="flex items-center gap-1.5 font-medium text-foreground"
                  aria-current="page"
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  // Map of path segments to labels
  const labelMap: Record<string, string> = {
    admin: 'Administração',
    dashboard: 'Dashboard',
    membros: 'Membros',
    comandas: 'Comandas',
    'nova-comanda': 'Nova Comanda',
    estoque: 'Estoque',
    historico: 'Histórico',
    dividas: 'Dívidas',
    creditos: 'Créditos',
    notificacoes: 'Notificações',
    pdv: 'PDV',
    configuracoes: 'Configurações',
    perfil: 'Perfil',
  };

  return segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = labelMap[segment] || capitalize(segment);

    return { label, href };
  });
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Hook to manage breadcrumbs
 */
export function useBreadcrumbs(customItems?: BreadcrumbItem[]) {
  const pathname = usePathname();
  const [items, setItems] = React.useState<BreadcrumbItem[]>(
    customItems || generateBreadcrumbsFromPath(pathname || '')
  );

  React.useEffect(() => {
    if (!customItems) {
      setItems(generateBreadcrumbsFromPath(pathname || ''));
    }
  }, [pathname, customItems]);

  return { items, setItems };
}

