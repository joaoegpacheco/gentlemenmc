import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, phone, user_name } = body;

    // Validações
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Senha é obrigatória' },
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
        { error: authError.message || 'Erro ao criar usuário na autenticação' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Usuário não foi criado' },
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
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

