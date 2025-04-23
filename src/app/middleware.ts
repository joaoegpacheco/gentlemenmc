import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/hooks/use-supabase";

// Rotas que apenas admins podem acessar
const adminRoutes = ["/protected/atualizar-pago-bebidas", "/protected/dividas-todos"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/protected")) return NextResponse.next();

  // Verifica se o usuário está autenticado
  const token = req.cookies.get("authToken")?.value;
  if (!token) return NextResponse.redirect(new URL("/", req.url));

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.redirect(new URL("/", req.url));

  // Se for uma rota de admin, verifica se o usuário é admin
  if (adminRoutes.includes(pathname)) {
    const { data: admins } = await supabase.from("admins").select("id").eq("id", user.id);
    if (!admins?.length) return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Ativa o middleware apenas para as rotas protegidas
export const config = {
  matcher: ["/protected/:path*"],
};
