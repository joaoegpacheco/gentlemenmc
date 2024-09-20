import { useMediaQuery } from "@/hooks/use-media-query";

export const useDeviceSizes = () => {
  const isMobile = useMediaQuery("(max-width: 770px)");

  return {
    isMobile
  };
};