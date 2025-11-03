import { toast } from "@/hooks/use-toast"

export const notification = {
  success: (options: { message: string; description?: string }) => {
    toast({
      description: options.description || options.message,
      variant: "default",
    })
  },
  error: (options: { message: string; description?: string }) => {
    toast({
      description: options.description || options.message,
      variant: "destructive",
    })
  },
  warning: (options: { message: string; description?: string }) => {
    toast({
      description: options.description || options.message,
      variant: "default",
    })
  },
  info: (options: { message: string; description?: string }) => {
    toast({
      description: options.description || options.message,
      variant: "default",
    })
  },
}

