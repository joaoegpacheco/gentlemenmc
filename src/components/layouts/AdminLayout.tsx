'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarSection } from '../ui/sidebar';
import { Breadcrumbs } from '../ui/breadcrumbs';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Receipt, 
  CreditCard, 
  Wallet,
  Bell,
  Settings,
  BarChart3,
  FileText,
  History,
} from 'lucide-react';
import { appStore$ } from '@/stores/appStore';
import { useObservable } from '@legendapp/state/react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin Layout with Sidebar Navigation
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const user = useObservable(appStore$.user);
  const isAdmin = user.admin.get();
  const isManager = user.manager.get();

  // Define sidebar sections based on user role
  const sidebarSections: SidebarSection[] = [
    {
      title: 'Principal',
      items: [
        {
          label: 'Dashboard',
          href: '/admin/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Gestão',
      items: [
        ...(isAdmin || isManager
          ? [
              {
                label: 'Membros',
                href: '/admin/membros',
                icon: Users,
              },
            ]
          : []),
        {
          label: 'Comandas',
          href: '/comandas',
          icon: Receipt,
        },
        {
          label: 'Estoque',
          href: '/admin/estoque',
          icon: Package,
          items: [
            {
              label: 'Produtos',
              href: '/admin/estoque',
              icon: Package,
            },
            {
              label: 'Histórico',
              href: '/admin/estoque/historico',
              icon: History,
            },
          ],
        },
      ],
    },
    {
      title: 'Financeiro',
      items: [
        {
          label: 'Dívidas',
          href: '/admin/dividas',
          icon: CreditCard,
        },
        {
          label: 'Créditos',
          href: '/admin/creditos',
          icon: Wallet,
        },
        {
          label: 'Relatórios',
          href: '/admin/relatorios',
          icon: FileText,
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'Administração',
            items: [
              {
                label: 'Notificações',
                href: '/admin/notificacoes',
                icon: Bell,
              },
              {
                label: 'Analytics',
                href: '/admin/analytics',
                icon: BarChart3,
              },
              {
                label: 'Configurações',
                href: '/admin/configuracoes',
                icon: Settings,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        sections={sidebarSections}
        header={
          <div className="font-bold text-lg">
            Gentlemen MC
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Breadcrumbs */}
        <header className="border-b bg-background p-4">
          <Breadcrumbs />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

