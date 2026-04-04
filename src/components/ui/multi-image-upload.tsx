"use client"

import * as React from "react"
import { Plus, X, Loader2, GripVertical, Crop } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageCropper } from "@/components/ui/image-cropper"

interface MultiImageUploadProps {
  value?: string[]
  onChange?: (urls: string[]) => void
  maxImages?: number
  accept?: string
  maxSize?: number // in MB
  label?: string
  description?: string
  className?: string
  disabled?: boolean
  folder?: string
  enableCrop?: boolean
  cropAspect?: number
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dhbc0owlv"
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "Matgary"

export function MultiImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  accept = "image/png, image/jpeg, image/webp",
  maxSize = 5,
  label,
  description,
  className,
  disabled = false,
  folder = "Matgary/products",
  enableCrop = true,
  cropAspect = 1,
}: MultiImageUploadProps) {
  const [images, setImages] = React.useState<string[]>(value)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  // Crop state
  const [showCropper, setShowCropper] = React.useState(false)
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null)

  React.useEffect(() => {
    setImages(value)
  }, [value])

  const uploadToCloudinary = async (file: File | Blob): Promise<string> => {
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
    return data.secure_url
  }

  const handleFiles = async (files: FileList) => {
    setError(null)
    
    const remainingSlots = maxImages - images.length
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    
    // Validate files
    for (const file of filesToUpload) {
      const allowedTypes = accept.split(",").map((t) => t.trim())
      if (!allowedTypes.some((type) => file.type === type || type === "*")) {
        setError("Invalid file type")
        return
      }
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File too large. Maximum: ${maxSize}MB`)
        return
      }
    }

    // If cropping is enabled and only one file, show cropper
    if (enableCrop && filesToUpload.length === 1) {
      const localPreview = URL.createObjectURL(filesToUpload[0])
      setImageToCrop(localPreview)
      setShowCropper(true)
      return
    }

    // Upload all files directly
    setIsUploading(true)
    try {
      const uploadPromises = filesToUpload.map((file) => uploadToCloudinary(file))
      const urls = await Promise.all(uploadPromises)
      
      const newImages = [...images, ...urls]
      setImages(newImages)
      onChange?.(newImages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop)
    }
    setImageToCrop(null)
    setShowCropper(false)
    
    setIsUploading(true)
    try {
      const url = await uploadToCloudinary(croppedBlob)
      const newImages = [...images, url]
      setImages(newImages)
      onChange?.(newImages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleCropCancel = () => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop)
    }
    setImageToCrop(null)
    setShowCropper(false)
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onChange?.(newImages)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)
    
    setImages(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    onChange?.(images)
  }

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {label && (
          <label className="block text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}

        {/* Image Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {/* Existing Images */}
          {images.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative aspect-square rounded-lg border-2 border-[var(--border)] overflow-hidden group cursor-move",
                draggedIndex === index && "opacity-50 border-[var(--primary)]"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drag handle indicator */}
              <div className="absolute top-1 left-1 p-1 rounded bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3" />
              </div>

              {/* First image badge */}
              {index === 0 && (
                <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--primary)] text-white">
                  Main
                </div>
              )}
            </div>
          ))}

          {/* Add New Image Button */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isUploading}
              className={cn(
                "aspect-square rounded-lg border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 transition-all",
                "hover:border-[var(--primary)] hover:bg-[var(--primary)]/5",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
              ) : enableCrop ? (
                <Crop className="w-6 h-6 text-[var(--muted-foreground)]" />
              ) : (
                <Plus className="w-6 h-6 text-[var(--muted-foreground)]" />
              )}
              <span className="text-xs text-[var(--muted-foreground)]">
                {isUploading ? "Uploading..." : "Add Image"}
              </span>
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={!enableCrop}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {/* Description */}
        {description && !error && (
          <p className="text-xs text-[var(--muted-foreground)]">
            {description}
          </p>
        )}

        {/* Counter */}
        <p className="text-xs text-[var(--muted-foreground)]">
          {images.length} / {maxImages} images • Drag to reorder • First image is the main photo
        </p>

        {/* Error */}
        {error && <p className="text-xs text-red-500">{error}</p>}
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
          cropShape="rect"
          title="Crop Product Image"
        />
      )}
    </>
  )
}

export { MultiImageUpload as default }
