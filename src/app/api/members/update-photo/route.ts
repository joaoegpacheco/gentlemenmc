import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As variáveis de ambiente do Supabase não estão definidas!");
}

// Helper function to get locale from request
function getLocaleFromRequest(request: NextRequest): string {
  // Try to get locale from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")
    const languages = acceptLanguage.split(',').map(lang => {
      const [locale] = lang.trim().split(';');
      return locale.toLowerCase().split('-')[0]; // Get base language (pt, en)
    });
    
    // Check if any supported locale is in the list
    for (const lang of languages) {
      if (routing.locales.includes(lang as any)) {
        return lang;
      }
    }
  }
  
  // Default to defaultLocale if no match found
  return routing.defaultLocale;
}

export async function PUT(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = await getTranslations({ locale, namespace: 'apiUpdatePhoto' });
  
  try {
    const body = await request.json();
    const { user_id, foto_url } = body;

    // Validações
    if (!user_id) {
      return NextResponse.json(
        { error: t('errors.userIdRequired') },
        { status: 400 }
      );
    }

    if (!foto_url) {
      return NextResponse.json(
        { error: t('errors.photoUrlRequired') },
        { status: 400 }
      );
    }

    // Obter o token de autenticação do cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: t('errors.notAuthenticated') },
        { status: 401 }
      );
    }

    // Criar cliente Supabase com o token do usuário
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    // Verificar se o usuário está autenticado
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário está tentando atualizar seu próprio perfil
    if (userData.user.id !== user_id) {
      return NextResponse.json(
        { error: 'Você só pode atualizar seu próprio perfil' },
        { status: 403 }
      );
    }

    // Atualizar foto na tabela membros
    const { data, error } = await supabase
      .from('membros')
      .update({ foto_url })
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar foto:', error);
      return NextResponse.json(
        { error: error.message || t('errors.errorUpdatingPhoto') },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error('Erro na API update-photo:', error);
    return NextResponse.json(
      { error: error.message || t('errors.internalServerError') },
      { status: 500 }
    );
  }
}

