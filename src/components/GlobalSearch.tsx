'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

/**
 * Global Search Component with Cmd+K shortcut
 */
export function GlobalSearch() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tSearch = useTranslations('globalSearch');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Define searchable items with translations
  const searchableItems: SearchResult[] = useMemo(() => [
    {
      id: 'dashboard',
      title: tSearch('items.dashboard.title'),
      description: tSearch('items.dashboard.description'),
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      category: tSearch('pages'),
    },
    {
      id: 'membros',
      title: tSearch('items.membros.title'),
      description: tSearch('items.membros.description'),
      href: '/admin/membros',
      icon: Users,
      category: tSearch('pages'),
    },
    {
      id: 'estoque',
      title: tSearch('items.estoque.title'),
      description: tSearch('items.estoque.description'),
      href: '/admin/estoque',
      icon: Package,
      category: tSearch('pages'),
    },
    {
      id: 'comandas',
      title: tSearch('items.comandas.title'),
      description: tSearch('items.comandas.description'),
      href: '/comandas',
      icon: Receipt,
      category: tSearch('pages'),
    },
    {
      id: 'nova-comanda',
      title: tSearch('items.novaComanda.title'),
      description: tSearch('items.novaComanda.description'),
      href: '/nova-comanda',
      icon: Receipt,
      category: tSearch('actions'),
    },
    {
      id: 'dividas',
      title: tSearch('items.dividas.title'),
      description: tSearch('items.dividas.description'),
      href: '/admin/dividas',
      icon: CreditCard,
      category: tSearch('pages'),
    },
    {
      id: 'creditos',
      title: tSearch('items.creditos.title'),
      description: tSearch('items.creditos.description'),
      href: '/admin/creditos',
      icon: Wallet,
      category: tSearch('pages'),
    },
    {
      id: 'notificacoes',
      title: tSearch('items.notificacoes.title'),
      description: tSearch('items.notificacoes.description'),
      href: '/admin/notificacoes',
      icon: Bell,
      category: tSearch('pages'),
    },
    {
      id: 'relatorios',
      title: tSearch('items.relatorios.title'),
      description: tSearch('items.relatorios.description'),
      href: '/admin/relatorios',
      icon: FileText,
      category: tSearch('pages'),
    },
    {
      id: 'configuracoes',
      title: tSearch('items.configuracoes.title'),
      description: tSearch('items.configuracoes.description'),
      href: '/admin/configuracoes',
      icon: Settings,
      category: tSearch('pages'),
    },
  ], [tSearch]);

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
  }, [searchableItems]);

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
<<<<<<< HEAD
        <span>{tSearch('searchPlaceholder')}</span>
=======
        <span>Buscar...</span>
>>>>>>> main
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={tSearch('typeToSearch')}
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

