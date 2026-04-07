"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DragState {
  isDragging: boolean;
  startX: number;
  startScrollLeft: number;
}

interface DraggableScrollProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DraggableScroll({
  children,
  className,
  contentClassName,
}: DraggableScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.setPointerCapture(event.pointerId);
    setDragState({
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const distance = event.clientX - dragState.startX;
    container.scrollLeft = dragState.startScrollLeft - distance;
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container?.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }

    setDragState((previous) => ({ ...previous, isDragging: false }));
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scrollbar-hide overflow-x-auto pb-3",
        "cursor-grab select-none active:cursor-grabbing",
        "snap-x snap-mandatory touch-pan-y",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
    >
      <div className={cn("flex gap-4 md:gap-6", contentClassName)}>{children}</div>
    </div>
  );
}
