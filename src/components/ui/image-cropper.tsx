"use client"

import * as React from "react"
import Cropper, { Area, Point } from "react-easy-crop"
import { Loader2, ZoomIn, ZoomOut, RotateCw, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ImageCropperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onSkipCrop?: () => void
  aspect?: number // undefined = free aspect ratio (resizable crop area)
  cropShape?: "rect" | "round"
  title?: string
}

// Helper function to create cropped image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("No 2d context")
  }

  const rotRad = getRadianAngle(rotation)

  // Calculate bounding box of rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // Translate canvas context to center before rotating
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)

  // Draw rotated image
  ctx.drawImage(image, 0, 0)

  // Create output canvas for cropped area
  const croppedCanvas = document.createElement("canvas")
  const croppedCtx = croppedCanvas.getContext("2d")

  if (!croppedCtx) {
    throw new Error("No 2d context")
  }

  // Set cropped canvas size
  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height

  // Draw cropped image
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Canvas is empty"))
      }
    }, "image/png", 0.95) // Changed to PNG with high quality to preserve transparency
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.crossOrigin = "anonymous"
    image.src = url
  })
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

export function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  onSkipCrop,
  aspect, // undefined = free aspect ratio
  cropShape = "rect",
  title = "Crop Image",
}: ImageCropperProps) {
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [currentAspect, setCurrentAspect] = React.useState<number | undefined>(aspect)

  const onCropChange = React.useCallback((location: Point) => {
    setCrop(location)
  }, [])

  const onZoomChange = React.useCallback((newZoom: number) => {
    setZoom(newZoom)
  }, [])

  const onCropAreaComplete = React.useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      onCropComplete(croppedBlob)
      onOpenChange(false)
      
      // Reset state
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setCurrentAspect(aspect)
    } catch (error) {
      console.error("Error cropping image:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkipCrop = () => {
    onSkipCrop?.()
    onOpenChange(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCurrentAspect(aspect)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCurrentAspect(aspect)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Crop Area */}
        <div className="relative h-80 w-full bg-[var(--muted)] rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={currentAspect}
            cropShape={cropShape}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
            classes={{
              containerClassName: "rounded-lg",
              cropAreaClassName: cropShape === "round" ? "rounded-full" : "rounded-lg",
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {/* Aspect Ratio Options */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-sm text-[var(--muted-foreground)]">Aspect:</span>
            <Button
              type="button"
              variant={currentAspect === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentAspect(undefined)}
            >
              Free
            </Button>
            <Button
              type="button"
              variant={currentAspect === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentAspect(1)}
            >
              1:1
            </Button>
            <Button
              type="button"
              variant={currentAspect === 16/9 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentAspect(16/9)}
            >
              16:9
            </Button>
            <Button
              type="button"
              variant={currentAspect === 4/3 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentAspect(4/3)}
            >
              4:3
            </Button>
            <Button
              type="button"
              variant={currentAspect === 3/2 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentAspect(3/2)}
            >
              3:2
            </Button>
          </div>

          {/* Zoom & Rotation Controls */}
          <div className="flex items-center justify-center gap-6">
            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                disabled={zoom <= 1}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <div className="w-32">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Rotation */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setRotation((rotation + 90) % 360)}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          {onSkipCrop && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSkipCrop}
              disabled={isProcessing}
            >
              Skip Crop
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImageCropper
