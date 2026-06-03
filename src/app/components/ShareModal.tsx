import React, { useRef } from 'react';
import { X, Download } from 'lucide-react';
import { Dream } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ShareModalProps {
  dream: Dream;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ dream, isOpen, onClose }) => {
  const posterRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    // In a real implementation, you would use html2canvas or similar library
    // For now, we'll simulate the download behavior
    alert('Download feature would save this poster as an image. In production, this would use html2canvas or a similar library to convert the poster to an image file.');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-card rounded-lg shadow-2xl max-w-lg w-full"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Share Dream
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Poster Card */}
            <div
              ref={posterRef}
              className="bg-background border-4 border-primary rounded-lg overflow-hidden shadow-xl"
            >
              {/* Image Section */}
              <div className="relative aspect-[4/3]">
                <img
                  src={dream.image}
                  alt={dream.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Tag on Image */}
                <div className="absolute top-4 left-4 text-xs uppercase tracking-wider text-white bg-primary px-3 py-1 rounded">
                  {dream.tag}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 bg-background">
                <h3
                  className="text-3xl mb-4 italic"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {dream.title}
                </h3>

                {/* Divider */}
                <div className="w-16 h-0.5 bg-primary mb-4" />

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  {dream.season && (
                    <div>
                      <span className="text-muted-foreground">Season:</span>{' '}
                      <span className="font-medium">{dream.season}</span>
                    </div>
                  )}
                  {dream.price && (
                    <div>
                      <span className="text-muted-foreground">Price:</span>{' '}
                      <span className="font-medium text-primary">${dream.price.toLocaleString()}</span>
                    </div>
                  )}
                  {dream.location && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Location:</span>{' '}
                      <span className="font-medium">{dream.location}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {dream.description}
                </p>

                {/* Signature */}
                <div className="text-right">
                  <span 
                    className="text-sm text-primary italic"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    Dreamboard
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
