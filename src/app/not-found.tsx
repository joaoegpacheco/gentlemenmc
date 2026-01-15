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
        alt="Page not found"
        width={200}
        height={200}
        style={{
          objectFit: "contain", // Garante que a imagem não distorça
        }}
      />
      <div>
        <h1 className="text-3xl font-bold m-0">404 - Page does not exist</h1>
        <p className="text-sm text-gray-600">
          The page you tried to access does not exist.
        </p>
      </div>
    </div>
  );
}
