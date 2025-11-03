import { toast } from "@/hooks/use-toast"

export const message = {
  success: (content: string) => {
    toast({
      description: content,
      variant: "default",
    })
  },
  error: (content: string) => {
    toast({
      description: content,
      variant: "destructive",
    })
  },
  warning: (content: string) => {
    toast({
      description: content,
      variant: "default",
    })
  },
  info: (content: string) => {
    toast({
      description: content,
      variant: "default",
    })
  },
}

