import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Please configure them in your Vercel project settings.`);
}

// Cliente admin com service_role para criar usuários
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = await getTranslations({ locale, namespace: 'apiCreateUser' });
  
  try {
    const body = await request.json();
    const { email, password, phone, user_name } = body;

    // Validações
    if (!email) {
      return NextResponse.json(
        { error: t('errors.emailRequired') },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: t('errors.passwordRequired') },
        { status: 400 }
      );
    }

    // Criar usuário na autenticação com email e senha
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Autoconfirmar o usuário
      user_metadata: {
        user_name: user_name || '',
      },
      phone: phone || undefined, // Telefone como campo direto
    });

    if (authError) {
      console.error('Erro ao criar usuário na autenticação:', authError);
      return NextResponse.json(
        { error: authError.message || t('errors.errorCreatingUser') },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: t('errors.userNotCreated') },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Atualizar o telefone diretamente no campo phone (se fornecido e não foi definido na criação)
    if (phone && !authData.user.phone) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          phone: phone,
        }
      );

      if (updateError) {
        console.error('Erro ao atualizar telefone do usuário:', updateError);
        // Não falhar aqui, apenas logar o erro
      }
    }

    // Retornar o ID do usuário criado
    return NextResponse.json({
      success: true,
      user_id: userId,
      email: authData.user.email,
    });

  } catch (error: any) {
    console.error('Erro na API create-user:', error);
    return NextResponse.json(
      { error: error.message || t('errors.internalServerError') },
      { status: 500 }
    );
  }
}

