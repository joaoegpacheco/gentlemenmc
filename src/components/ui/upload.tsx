"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Upload as UploadIcon } from "lucide-react"

export interface UploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  beforeUpload?: (file: File) => boolean | Promise<boolean>
  onChange?: (info: { file: File | null }) => void
  showUploadList?: boolean
  accept?: string
}

const Upload = React.forwardRef<HTMLInputElement, UploadProps>(
  ({ className, beforeUpload, onChange, showUploadList = true, accept, ...props }, ref) => {
    const [file, setFile] = React.useState<File | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) return

      let shouldUpload = true
      if (beforeUpload) {
        shouldUpload = await beforeUpload(selectedFile)
      }

      if (shouldUpload) {
        setFile(selectedFile)
        onChange?.({ file: selectedFile })
      }
    }

    const handleClick = () => {
      fileInputRef.current?.click()
    }

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <input
          ref={(node) => {
            fileInputRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
            }
          }}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          {...props}
        />  
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          className="w-full"
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          Selecionar arquivo
        </Button>
        {showUploadList && file && (
          <div className="text-sm text-muted-foreground">
            {file.name}
          </div>
        )}
      </div>
    )
  }
)
Upload.displayName = "Upload"

export { Upload }

