export function shouldSkipImageOptimization(src: string): boolean {
  return (
    src.startsWith("blob:") ||
    src.startsWith("data:") ||
    src.includes(".supabase.co/storage/")
  );
}
