import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Share2, Check } from 'lucide-react';
import { Dream } from '../types';

interface CompletionModalProps {
  isOpen: boolean;
  dream: Dream;
  photoUrl: string;
  onSave: (shared: boolean) => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  dream,
  photoUrl,
  onSave,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  // Show ONLY checked items
  const completedItems = dream.bucketItems?.filter(item => item.checked) || [];

  const generateStoryImage = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not found'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not found'));
        return;
      }

      // Story format: 3:5 ratio (portrait/vertical)
      const width = 1080;  // 3 parts
      const height = 1800; // 5 parts (1080 * 5/3 = 1800)
      canvas.width = width;
      canvas.height = height;

      // Calculate how many items to show (max 4)
      const itemsToShow = completedItems.slice(0, 3);

      // FIXED overlay at 68% - works for all item counts
      const overlayStart = height * 0.68; // 1224px

      // Load and draw the photo
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Calculate photo dimensions to cover the entire canvas
        const canvasAspect = width / height;
        const imgAspect = img.width / img.height;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        if (imgAspect > canvasAspect) {
          // Image is wider - fit to height
          drawHeight = height;
          drawWidth = drawHeight * imgAspect;
          offsetX = (width - drawWidth) / 2;
        } else {
          // Image is taller - fit to width
          drawWidth = width;
          drawHeight = drawWidth / imgAspect;
          offsetY = (height - drawHeight) / 2;
        }
        
        // Draw photo covering entire canvas
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // White gradient overlay - smoother, starts earlier
        const gradientStartPoint = overlayStart * 0.85; // Start gradient earlier for smooth transition
        const gradient = ctx.createLinearGradient(0, gradientStartPoint, 0, height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.7)');
        gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, gradientStartPoint, width, height - gradientStartPoint);

        // Simple fixed spacing - no complex calculations
        let contentY = overlayStart + 80; // Start 80px below overlay - more breathing room
        const contentPadding = 60;
        const badgeHeight = 60;

        // Completed Badge (smaller)
        const badgeX = contentPadding;
        const badgeY = contentY;
        
        ctx.fillStyle = '#CDA85C';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, 340, badgeHeight, 10);
        ctx.fill();

        // Badge checkmark icon
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const checkX = badgeX + 26;
        const checkY = badgeY + 30;
        ctx.moveTo(checkX - 5, checkY);
        ctx.lineTo(checkX - 2, checkY + 6);
        ctx.lineTo(checkX + 8, checkY - 6);
        ctx.stroke();

        // Badge text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 28px DM Sans';
        ctx.textAlign = 'left';
        ctx.fillText('Dream Completed!', badgeX + 64, badgeY + 38);
        
        contentY += badgeHeight + 50; // BIGGER spacing after badge

        // Dream title
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'italic 700 72px Cormorant Garamond';
        ctx.textAlign = 'left';
        
        // Word wrap title
        const words = dream.title.split(' ');
        let line = '';
        const maxWidth = width - contentPadding * 2;
        const lineHeight = 80;

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, contentPadding, contentY);
            line = words[i] + ' ';
            contentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, contentPadding, contentY);
        contentY += 55; // BIGGER spacing after title

        // Completed items (show max 4)
        if (itemsToShow.length > 0) {
          ctx.font = '400 30px DM Sans';

          itemsToShow.forEach((item) => {
            // Gold checkmark circle
            const circleX = contentPadding + 20;
            const circleY = contentY + 6;
            const circleRadius = 20;
            
            ctx.fillStyle = '#CDA85C';
            ctx.beginPath();
            ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
            ctx.fill();

            // Check icon
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(circleX - 7, circleY);
            ctx.lineTo(circleX - 3, circleY + 5);
            ctx.lineTo(circleX + 7, circleY - 5);
            ctx.stroke();

            // Item text
            ctx.fillStyle = '#6B7280';
            ctx.textAlign = 'left';
            const textX = contentPadding + 56;
            const maxTextWidth = width - textX - contentPadding;
            let text = item.text;
            let metrics = ctx.measureText(text);
            
            while (metrics.width > maxTextWidth && text.length > 0) {
              text = text.slice(0, -4) + '...';
              metrics = ctx.measureText(text);
            }
            
            ctx.fillText(text, textX, contentY + 12);
            contentY += 55; // BIGGER spacing between items
          });
        }

        // Small watermark "DreamBoard" in bottom right corner
        ctx.fillStyle = '#9CA3AF';
        ctx.font = 'italic 400 28px Cormorant Garamond';
        ctx.textAlign = 'right';
        ctx.fillText('DreamBoard', width - 50, height - 50);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = photoUrl;
    });
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      // Generate story image
      const blob = await generateStoryImage();
      const file = new File([blob], 'dream-completed.png', { type: 'image/png' });

      // Try native share API
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `I completed my dream: ${dream.title}`,
          text: `Just achieved my dream "${dream.title}" 🎉`,
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dream-completed.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    }
    
    setIsSharing(false);
    onSave(true);
  };

  const handleSkipShare = () => {
    onSave(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
    >
      {/* Hidden canvas for story generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Close Button */}
      <button
        onClick={handleSkipShare}
        className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-colors text-white z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Content Card - Mobile: 65vh, NO SCROLL */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Photo with gradient overlay */}
        <div className="relative h-[45vh] md:h-[50vh]">
          <img
            src={photoUrl}
            alt={dream.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for smooth transition to white block */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" />
        </div>
          
        {/* White content block - always visible, scrollable if needed */}
        <div className="flex-shrink-0 bg-white px-6 pt-6 pb-6 overflow-y-auto flex flex-col">
          {/* Completed Badge */}
          <div className="mb-5">
            <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Dream Completed!
            </div>
          </div>

          {/* Title */}
          <h2
            className="text-2xl md:text-3xl text-[#1A1A1A] italic leading-tight"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {dream.title}
          </h2>

          {/* Spacer to push tasks to bottom */}
          <div className="flex-1" />

          {/* Checked items - show max 3 - stuck to bottom */}
          {completedItems.length > 0 && (
            <div className="space-y-2 mb-4">
              {completedItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 text-sm text-[#1A1A1A]"
                >
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                  <span className="flex-1 line-clamp-2">{item.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions - ALWAYS VISIBLE */}
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              <Share2 className="w-4 h-4" />
              {isSharing ? 'Creating...' : 'Share'}
            </button>
            <button
              onClick={handleSkipShare}
              className="px-4 py-2.5 rounded-lg font-semibold border border-border hover:bg-muted/50 transition-colors bg-white text-[#1A1A1A] text-sm"
            >
              Skip
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CompletionModal;