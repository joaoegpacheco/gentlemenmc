"use client"
import Image from 'next/image';
import { useDeviceSizes } from '@/utils/mediaQueries'

export default function NotFoundPage() {
    const { isMobile } = useDeviceSizes()
  return (
    <div
      className={`
        flex items-center justify-center h-screen text-center
        ${isMobile ? "flex-col gap-5" : "flex-row gap-5"}
      `}
    >
      <Image
        src="/images/gentlemenmc.png"
        alt="Página não encontrada"
        width={200}
        height={200}
        style={{
          objectFit: "contain", // Garante que a imagem não distorça
        }}
      />
      <div>
        <h1 className="text-3xl font-bold m-0">404 - Página não existe</h1>
        <p className="text-sm text-gray-600">
          A página que você tentou acessar não existe.
        </p>
      </div>
    </div>
  );
}
