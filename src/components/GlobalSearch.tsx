'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  CreditCard,
  Wallet,
  Bell,
  Settings,
  Search,
  FileText,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  category: string;
}

// Define searchable items (moved outside component to avoid recreation)
const searchableItems: SearchResult[] = [
    // Pages
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Visão geral do sistema',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      category: 'Páginas',
    },
    {
      id: 'membros',
      title: 'Membros',
      description: 'Gerenciar membros do clube',
      href: '/admin/membros',
      icon: Users,
      category: 'Páginas',
    },
    {
      id: 'estoque',
      title: 'Estoque',
      description: 'Controle de estoque',
      href: '/admin/estoque',
      icon: Package,
      category: 'Páginas',
    },
    {
      id: 'comandas',
      title: 'Comandas',
      description: 'Gerenciar comandas',
      href: '/comandas',
      icon: Receipt,
      category: 'Páginas',
    },
    {
      id: 'nova-comanda',
      title: 'Nova Comanda',
      description: 'Criar nova comanda',
      href: '/nova-comanda',
      icon: Receipt,
      category: 'Ações',
    },
    {
      id: 'dividas',
      title: 'Dívidas',
      description: 'Gerenciar dívidas',
      href: '/admin/dividas',
      icon: CreditCard,
      category: 'Páginas',
    },
    {
      id: 'creditos',
      title: 'Créditos',
      description: 'Gerenciar créditos',
      href: '/admin/creditos',
      icon: Wallet,
      category: 'Páginas',
    },
    {
      id: 'notificacoes',
      title: 'Notificações',
      description: 'Centro de notificações',
      href: '/admin/notificacoes',
      icon: Bell,
      category: 'Páginas',
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      description: 'Relatórios e análises',
      href: '/admin/relatorios',
      icon: FileText,
      category: 'Páginas',
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Configurações do sistema',
      href: '/admin/configuracoes',
      icon: Settings,
      category: 'Páginas',
    },
];

/**
 * Global Search Component with Cmd+K shortcut
 */
export function GlobalSearch() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search function
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = searchableItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
      );
    });

    setResults(filtered);
  }, []);

  // Handle search input change
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 150); // Debounce

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Handle item selection
  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <>
      {/* Trigger Button (optional - can be placed in header) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Digite para buscar..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? t('searching') : t('noResults')}
          </CommandEmpty>

          {Object.entries(groupedResults).map(([category, items], index) => (
            <React.Fragment key={category}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={category}>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.title}
                      onSelect={() => handleSelect(item.href)}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

