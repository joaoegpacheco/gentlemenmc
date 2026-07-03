import Image, { type ImageProps } from "next/image";

import { shouldSkipImageOptimization } from "@/lib/remote-image";

export function RemoteImage({ src, alt, ...props }: ImageProps) {
  const srcString = typeof src === "string" ? src : "";

  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={shouldSkipImageOptimization(srcString)}
      {...props}
    />
  );
}
