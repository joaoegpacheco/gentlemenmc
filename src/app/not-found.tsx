"use client"
import Image from 'next/image';
import { useDeviceSizes } from '@/utils/mediaQueries'

export default function NotFoundPage() {
    const { isMobile } = useDeviceSizes()
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh", 
        textAlign: "center",
        flexDirection: isMobile ? "column" : "row", 
        gap: "20px", 
      }}
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
        <h1 style={{ fontSize: "2rem", margin: "0" }}>404 - Página não existe</h1>
        <p style={{ fontSize: "0.9rem", color: "#555" }}>
          A página que você tentou acessar não existe.
        </p>
      </div>
    </div>
  );
}
