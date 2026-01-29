'use client';

import React from 'react';
// import { usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
// import { Sidebar, SidebarSection } from '../ui/sidebar';
// import { Breadcrumbs } from '../ui/breadcrumbs';
// import { 
//   LayoutDashboard, 
//   Users, 
//   Package, 
//   Receipt, 
//   CreditCard, 
//   Wallet,
//   Bell,
//   Settings,
//   BarChart3,
//   FileText,
//   History,
//   Award,
// } from 'lucide-react';
import { appStore$ } from '@/stores/appStore';
import { useObservable } from '@legendapp/state/react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin Layout with Sidebar Navigation
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  // const pathname = usePathname();
  const t = useTranslations('adminLayout');
  const user = useObservable(appStore$.user);
  const isAdmin = user.admin.get();
  const isManager = user.manager.get();

  // Define sidebar sections based on user role
  // const sidebarSections: SidebarSection[] = [
  //   {
  //     title: t('main'),
  //     items: [
  //       {
  //         label: t('dashboard'),
  //         href: '/admin/dashboard',
  //         icon: LayoutDashboard,
  //       },
  //     ],
  //   },
  //   {
  //     title: t('management'),
  //     items: [
  //       ...(isAdmin || isManager
  //         ? [
  //             {
  //               label: t('members'),
  //               href: '/admin/membros',
  //               icon: Users,
  //             },
  //           ]
  //         : []),
  //       {
  //         label: t('orders'),
  //         href: '/comandas',
  //         icon: Receipt,
  //       },
  //       {
  //         label: t('stock'),
  //         href: '/admin/estoque',
  //         icon: Package,
  //         items: [
  //           {
  //             label: t('products'),
  //             href: '/admin/estoque',
  //             icon: Package,
  //           },
  //           {
  //             label: t('history'),
  //             href: '/admin/estoque/historico',
  //             icon: History,
  //           },
  //         ],
  //       },
  //       {
  //         label: 'Validação Prospectos',
  //         href: '/admin/prospectos/validacao',
  //         icon: Award,
  //       },
  //     ],
  //   },
  //   {
  //     title: t('financial'),
  //     items: [
  //       {
  //         label: t('debts'),
  //         href: '/admin/dividas',
  //         icon: CreditCard,
  //       },
  //       {
  //         label: t('credits'),
  //         href: '/admin/creditos',
  //         icon: Wallet,
  //       },
  //       {
  //         label: t('reports'),
  //         href: '/admin/relatorios',
  //         icon: FileText,
  //       },
  //     ],
  //   },
  //   ...(isAdmin
  //     ? [
  //         {
  //           title: t('administration'),
  //           items: [
  //             {
  //               label: t('notifications'),
  //               href: '/admin/notificacoes',
  //               icon: Bell,
  //             },
  //             {
  //               label: t('analytics'),
  //               href: '/admin/analytics',
  //               icon: BarChart3,
  //             },
  //             {
  //               label: t('settings'),
  //               href: '/admin/configuracoes',
  //               icon: Settings,
  //             },
  //           ],
  //         },
  //       ]
  //     : []),
  // ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sidebar */}
      {/* <Sidebar
        sections={sidebarSections}
        header={
          <div className="font-bold text-lg">
            Gentlemen MC
          </div>
        }
      /> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Breadcrumbs */}
        {/* <header className="border-b bg-background p-4">
          <Breadcrumbs />
        </header> */}

        {/* Page Content - sem overflow para scroll só do navegador */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

