"use client"

import * as React from "react"
import { Upload, X, Image as ImageIcon, Loader2, Crop } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageCropper } from "@/components/ui/image-cropper"

interface ImageUploadProps {
  value?: string
  onChange?: (url: string | null) => void
  onUpload?: (url: string) => void
  onRemove?: () => void
  accept?: string
  maxSize?: number // in MB
  recommendedSize?: string
  shape?: "square" | "circle"
  size?: "sm" | "md" | "lg"
  label?: string
  description?: string
  className?: string
  disabled?: boolean
  folder?: string
  enableCrop?: boolean
  cropAspect?: number
}

const sizeClasses = {
  sm: "w-20 h-20",
  md: "w-32 h-32",
  lg: "w-40 h-40",
}

// Cloudinary cloud name from environment
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dhbc0owlv"
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "Matgary"

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onRemove,
  accept = "image/png, image/jpeg, image/webp",
  maxSize = 5,
  recommendedSize = "512x512px",
  shape = "square",
  size = "md",
  label,
  description,
  className,
  disabled = false,
  folder = "Matgary/stores",
  enableCrop = true,
  cropAspect = 1,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<string | null>(value || null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  // Crop state
  const [showCropper, setShowCropper] = React.useState(false)
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null)
  const [pendingFile, setPendingFile] = React.useState<File | null>(null)

  React.useEffect(() => {
    setPreview(value || null)
  }, [value])

  const uploadToCloudinary = async (file: File | Blob) => {
    setIsUploading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      formData.append("folder", folder)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      
      setPreview(data.secure_url)
      onChange?.(data.secure_url)
      onUpload?.(data.secure_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setPreview(value || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFile = async (file: File) => {
    setError(null)

    // Validate file type
    const allowedTypes = accept.split(",").map((t) => t.trim())
    if (!allowedTypes.some((type) => file.type === type || type === "*")) {
      setError("Invalid file type")
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File too large. Maximum: ${maxSize}MB`)
      return
    }

    // If cropping is enabled, show the cropper first
    if (enableCrop) {
      const localPreview = URL.createObjectURL(file)
      setImageToCrop(localPreview)
      setPendingFile(file)
      setShowCropper(true)
    } else {
      // Direct upload without cropping
      const localPreview = URL.createObjectURL(file)
      setPreview(localPreview)
      await uploadToCloudinary(file)
      URL.revokeObjectURL(localPreview)
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Clean up the original preview URL
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop)
    }
    
    // Create preview from cropped blob
    const croppedPreview = URL.createObjectURL(croppedBlob)
    setPreview(croppedPreview)
    
    // Upload cropped image
    await uploadToCloudinary(croppedBlob)
    
    // Cleanup
    URL.revokeObjectURL(croppedPreview)
    setImageToCrop(null)
    setPendingFile(null)
  }

  const handleCropCancel = () => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop)
    }
    setImageToCrop(null)
    setPendingFile(null)
    setShowCropper(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return
    
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setError(null)
    onChange?.(null)
    onRemove?.()
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click()
    }
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {label && (
          <label className="block text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex items-center justify-center border-2 border-dashed transition-all cursor-pointer",
            sizeClasses[size],
            shape === "circle" ? "rounded-full" : "rounded-xl",
            isDragging
              ? "border-[var(--primary)] bg-[var(--primary)]/5"
              : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/50",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-red-500"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-[var(--muted-foreground)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              <span className="text-xs">Uploading...</span>
            </div>
          ) : preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className={cn(
                  "object-cover w-full h-full",
                  shape === "circle" ? "rounded-full" : "rounded-xl"
                )}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[var(--muted-foreground)] p-4">
              {isDragging ? (
                <Upload className="w-8 h-8 text-[var(--primary)]" />
              ) : enableCrop ? (
                <Crop className="w-8 h-8" />
              ) : (
                <ImageIcon className="w-8 h-8" />
              )}
              <span className="text-xs text-center">
                {isDragging ? "Drop here" : enableCrop ? "Click to crop & upload" : "Click or drag"}
              </span>
            </div>
          )}
        </div>

        {description && !error && (
          <p className="text-xs text-[var(--muted-foreground)]">
            {description}
            {recommendedSize && (
              <span className="block">Recommended: {recommendedSize}</span>
            )}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>

      {/* Image Cropper Dialog */}
      {imageToCrop && (
        <ImageCropper
          open={showCropper}
          onOpenChange={(open) => {
            if (!open) handleCropCancel()
          }}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          aspect={cropAspect}
          cropShape={shape === "circle" ? "round" : "rect"}
          title="Crop Image"
        />
      )}
    </>
  )
}

export { ImageUpload as default }
