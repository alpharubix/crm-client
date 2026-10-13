import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Download,
  X,
  Maximize2,
  FileImage,
} from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  caption?: string;
  title?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
  title = 'Image Preview',
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset controls when a new image is opened
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, imageUrl]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `whatsapp_image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback
      window.open(imageUrl, '_blank');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-md select-none animate-in fade-in duration-150"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Floating Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent text-white z-20">
        {/* Title / Caption */}
        <div className="flex items-center gap-2 max-w-sm sm:max-w-md truncate">
          <FileImage className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">
            {caption || title}
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-md px-2 sm:px-3 py-1.5 rounded-2xl border border-white/15">
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Current Zoom Level Badge */}
          <button
            type="button"
            onClick={handleReset}
            className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md hover:bg-white/15 text-slate-200 hover:text-white transition-colors"
            title="Click to reset zoom (100%)"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4.0}
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-0.5" />

          {/* Reset View Button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/15 transition-all"
            title="Reset View (R / 0)"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Rotate 90deg Button */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/15 transition-all"
            title="Rotate 90°"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* Download Image Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/15 transition-all"
            title="Download image"
          >
            <Download className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-0.5" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-300 hover:text-rose-100 hover:bg-rose-500/30 transition-all"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Image Viewport */}
      <div
        className={`flex-1 relative flex items-center justify-center overflow-hidden cursor-grab ${
          isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={imageUrl}
          alt={caption || 'WhatsApp Preview'}
          draggable={false}
          className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-75 select-none pointer-events-auto"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        />
      </div>

      {/* Bottom Caption Bar */}
      {caption && (
        <div className="px-6 py-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex justify-center z-20">
          <div className="max-w-2xl bg-black/60 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2 text-center text-xs sm:text-sm text-slate-200 shadow-xl">
            {caption}
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="pb-2 text-center text-[11px] text-slate-400 select-none z-10">
        Scroll to zoom • Double-click to toggle 2x • Drag to pan • Press Esc to close
      </div>
    </div>,
    document.body
  );
};
