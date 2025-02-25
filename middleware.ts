import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value; // Obtendo o token do cookie
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login"); // Definir rotas públicas

  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", req.url)); // Redireciona se não estiver logado
  }

  return NextResponse.next(); // Libera acesso
}

// Define quais rotas devem ser protegidas
export const config = {
  matcher: ["/comandas/:path*"], // Protegendo rotas privadas
};
