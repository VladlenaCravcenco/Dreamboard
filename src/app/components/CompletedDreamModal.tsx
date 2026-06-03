import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, DollarSign, FileText, Share2 } from 'lucide-react';
import { CompletedDream } from '../types';
import { useDreams } from '../context/DreamContext';
import CompletionModal from './CompletionModal';

interface CompletedDreamModalProps {
  dream: CompletedDream | null;
  isOpen: boolean;
  onClose: () => void;
  note?: string;
  savedAmount?: number;
}

const CompletedDreamModal: React.FC<CompletedDreamModalProps> = ({
  dream,
  isOpen,
  onClose,
  note = '',
  savedAmount = 0,
}) => {
  const { completionPhotos } = useDreams();
  const [isPhotoOnTop, setIsPhotoOnTop] = React.useState(true);
  const [showShareModal, setShowShareModal] = React.useState(false);
  
  // Reset to photo on top when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsPhotoOnTop(true);
    }
  }, [isOpen]);
  
  if (!dream) return null;
  
  // Get photo from completionPhotos
  const photoData = completionPhotos.find(p => p.dreamId === dream.id);
  const completionPhotoUrl = photoData?.photoUrl;

  // Debug
  console.log('Modal Note:', note);
  console.log('Modal Note Length:', note?.length);
  console.log('Modal Note Boolean:', !!note);

  const completedDate = dream.completedAt 
    ? new Date(dream.completedAt).toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : '';

  const bucketItems = dream.bucketItems || [];
  const checkedItems = bucketItems.filter(item => item.checked);
  const totalItems = bucketItems.length;
  const completionPercent = totalItems > 0 ? (checkedItems.length / totalItems) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10 backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col md:flex-row gap-6 max-w-6xl w-full items-stretch" onClick={(e) => e.stopPropagation()}>
            {/* Mobile: Stacked Cards Container */}
            <div className="md:hidden relative w-full h-[80vh] max-h-[700px]">
              {/* Photo Card */}
              <motion.div
                animate={{ 
                  zIndex: isPhotoOnTop ? 20 : 10,
                  scale: isPhotoOnTop ? 1 : 0.95,
                  y: isPhotoOnTop ? 0 : 20,
                  rotate: isPhotoOnTop ? 3 : 1
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute inset-0 bg-card rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                onClick={() => setIsPhotoOnTop(!isPhotoOnTop)}
              >
                <div className="relative h-full">
                  {completionPhotoUrl ? (
                    <img
                      src={completionPhotoUrl}
                      alt={dream.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      No photo
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Title Overlay */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                        Completed
                      </div>
                      {completedDate && (
                        <span className="text-white/90 text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          {completedDate}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareModal(true);
                        }}
                        className="ml-auto p-2 bg-black/30 hover:bg-black/50 text-white rounded-lg backdrop-blur-sm transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h2
                      className="text-4xl text-white italic leading-tight"
                      style={{ fontFamily: 'Cormorant Garamond, serif' }}
                    >
                      {dream.title}
                    </h2>
                  </div>

                  {/* Tap Indicator */}
                  {isPhotoOnTop && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                      Tap to see details
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Info Card */}
              <motion.div
                animate={{ 
                  zIndex: isPhotoOnTop ? 10 : 20,
                  scale: isPhotoOnTop ? 0.95 : 1,
                  y: isPhotoOnTop ? 20 : 0,
                  rotate: isPhotoOnTop ? -1 : -3
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute inset-0 bg-card rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
                onClick={() => setIsPhotoOnTop(!isPhotoOnTop)}
              >
                <div className="h-full overflow-y-auto p-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Savings */}
                    {dream.price && (
                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5 text-primary" />
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                            Spent
                          </span>
                        </div>
                        <div className="text-3xl font-semibold text-primary mb-1">
                          ${savedAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          of ${dream.price.toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Checklist Progress */}
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-5 h-5 text-primary" />
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                          Completed
                        </span>
                      </div>
                      <div className="text-3xl font-semibold text-primary mb-1">
                        {checkedItems.length}/{totalItems}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {completionPercent.toFixed(0)}% tasks
                      </div>
                    </div>
                  </div>

                  {/* What was done */}
                  <div className="mb-6">
                    <h3
                      className="text-xl mb-3 flex items-center gap-2"
                      style={{ fontFamily: 'Cormorant Garamond, serif' }}
                    >
                      What was done
                    </h3>
                    <div className="space-y-2">
                      {bucketItems.length > 0 ? (
                        bucketItems.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-start gap-2 p-2.5 rounded-lg transition-colors ${
                              item.checked
                                ? 'bg-primary/10 border border-primary/20'
                                : 'bg-muted/20'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                item.checked
                                  ? 'bg-primary border-primary'
                                  : 'border-muted'
                              }`}
                            >
                              {item.checked && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <span
                              className={`flex-1 text-sm ${
                                item.checked ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {item.text}
                            </span>
                            {item.isAITip && (
                              <span className="text-xs px-2 py-0.5 bg-sage/20 text-sage rounded">
                                AI
                              </span>
                            )}
                            {item.isCustom && (
                              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                                My
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic text-sm">No tasks</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <h3
                      className="text-xl mb-3 flex items-center gap-2"
                      style={{ fontFamily: 'Cormorant Garamond, serif' }}
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      Notes
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border min-h-[80px]">
                      {note && note.trim() ? (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {note}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic text-sm">
                          No notes yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(dream.season || dream.duration || dream.location) && (
                    <div className="border-t border-border pt-4">
                      <div className="grid grid-cols-3 gap-3">
                        {dream.season && (
                          <div>
                            <div className="text-xs text-muted-foreground uppercase mb-1 font-medium">
                              Season
                            </div>
                            <div className="text-sm font-medium">{dream.season}</div>
                          </div>
                        )}
                        {dream.duration && (
                          <div>
                            <div className="text-xs text-muted-foreground uppercase mb-1 font-medium">
                              Duration
                            </div>
                            <div className="text-sm font-medium">{dream.duration}</div>
                          </div>
                        )}
                        {dream.location && (
                          <div>
                            <div className="text-xs text-muted-foreground uppercase mb-1 font-medium">
                              Place
                            </div>
                            <div className="text-sm font-medium">{dream.location}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tap Indicator */}
                  {!isPhotoOnTop && (
                    <div className="mt-6 text-center bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full text-primary text-sm">
                      Tap to see photo
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Desktop: Side by Side Cards */}
            {/* Left Card - Photo */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotate: 0 }}
              animate={{ opacity: 1, x: 0, rotate: 2 }}
              exit={{ opacity: 0, x: -50, rotate: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="hidden md:block w-[45%] bg-card rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
              style={{ transformOrigin: 'center center' }}
            >
              <div className="relative h-full min-h-[400px] md:min-h-[600px]">
                {completionPhotoUrl ? (
                  <img
                    src={completionPhotoUrl}
                    alt={dream.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                    No photo
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Title Overlay */}
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-lg">
                      <Check className="w-4 h-4" />
                      Completed
                    </div>
                    {completedDate && (
                      <span className="text-white/90 text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        {completedDate}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowShareModal(true);
                      }}
                      className="ml-auto p-2 bg-black/30 hover:bg-black/50 text-white rounded-lg backdrop-blur-sm transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h2
                    className="text-5xl text-white italic leading-tight"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {dream.title}
                  </h2>
                </div>
              </div>
            </motion.div>

            {/* Right Card - Content */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 0 }}
              animate={{ opacity: 1, x: 0, rotate: -2 }}
              exit={{ opacity: 0, x: 50, rotate: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="hidden md:flex flex-1 bg-card rounded-2xl shadow-2xl overflow-hidden flex-col"
              style={{ transformOrigin: 'center center' }}
            >
              <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {/* Savings */}
                  {dream.price && (
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                          Spent
                        </span>
                      </div>
                      <div className="text-3xl font-semibold text-primary mb-1">
                        ${savedAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        of ${dream.price.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Checklist Progress */}
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-primary" />
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        Completed
                      </span>
                    </div>
                    <div className="text-3xl font-semibold text-primary mb-1">
                      {checkedItems.length}/{totalItems}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {completionPercent.toFixed(0)}% tasks
                    </div>
                  </div>
                </div>

                {/* What was done */}
                <div className="mb-8">
                  <h3
                    className="text-2xl mb-4 flex items-center gap-2"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    What was done
                  </h3>
                  <div className="space-y-2">
                    {bucketItems.length > 0 ? (
                      bucketItems.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                            item.checked
                              ? 'bg-primary/10 border border-primary/20'
                              : 'bg-muted/20'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              item.checked
                                ? 'bg-primary border-primary'
                                : 'border-muted'
                            }`}
                          >
                            {item.checked && <Check className="w-4 h-4 text-primary-foreground" />}
                          </div>
                          <span
                            className={`flex-1 ${
                              item.checked ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {item.text}
                          </span>
                          {item.isAITip && (
                            <span className="text-xs px-2 py-0.5 bg-sage/20 text-sage rounded">
                              AI tip
                            </span>
                          )}
                          {item.isCustom && (
                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                              My item
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">No tasks</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-8">
                  <h3
                    className="text-2xl mb-4 flex items-center gap-2"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    Notes
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-5 border border-border min-h-[100px]">
                    {note && note.trim() ? (
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {note}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No notes yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {(dream.season || dream.duration || dream.location) && (
                  <div className="border-t border-border pt-6">
                    <div className="grid grid-cols-3 gap-4">
                      {dream.season && (
                        <div>
                          <div className="text-xs text-muted-foreground uppercase mb-1.5 font-medium">
                            Season
                          </div>
                          <div className="font-medium">{dream.season}</div>
                        </div>
                      )}
                      {dream.duration && (
                        <div>
                          <div className="text-xs text-muted-foreground uppercase mb-1.5 font-medium">
                            Duration
                          </div>
                          <div className="font-medium">{dream.duration}</div>
                        </div>
                      )}
                      {dream.location && (
                        <div>
                          <div className="text-xs text-muted-foreground uppercase mb-1.5 font-medium">
                            Place
                          </div>
                          <div className="font-medium">{dream.location}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Share Modal */}
          {showShareModal && dream && (
            <CompletionModal
              isOpen={showShareModal}
              dream={dream}
              photoUrl={completionPhotoUrl || dream.image || ''}
              onSave={(shared) => setShowShareModal(false)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompletedDreamModal;