import React, { useState } from 'react';
import { useDreams } from '../context/DreamContext';
import { motion } from 'motion/react';
import CompletedDreamModal from '../components/CompletedDreamModal';
import { CompletedDream } from '../types';

const CompletedScreen: React.FC = () => {
  const { completedDreams, dreamProgress, dreamNotes, completionPhotos } = useDreams();
  const [selectedDream, setSelectedDream] = useState<CompletedDream | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDreamClick = (dream: CompletedDream) => {
    setSelectedDream(dream);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedDream(null), 300);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Completed dreams
        </h1>
        <p className="text-muted-foreground italic">
          {completedDreams.length} {completedDreams.length === 1 ? 'place' : 'places'} that changed me
        </p>
      </div>

      {/* Gallery Grid */}
      {completedDreams.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {completedDreams.map((completed, index) => {
            // Use combination of id, completedAt, and index for unique key
            const uniqueKey = `${completed.id}-${completed.completedAt || index}`;
            
            // Get photo from completionPhotos
            const photoData = completionPhotos.find(p => p.dreamId === completed.id);
            const photoUrl = photoData?.photoUrl;
            
            return (
              <motion.div
                key={uniqueKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => handleDreamClick(completed)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={completed.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm italic">
                    No photo
                  </div>
                )}

                {/* Completed Stamp */}
                <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  ✓ Completed
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <h3
                    className="text-white text-xl italic"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {completed.title}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <p
            className="text-2xl text-muted-foreground italic"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            No completed dreams yet. Start your journey!
          </p>
        </div>
      )}

      {/* Modal */}
      <CompletedDreamModal
        dream={selectedDream}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        note={selectedDream ? (dreamNotes.find(n => n.dreamId === selectedDream.id)?.note || '') : ''}
        savedAmount={selectedDream ? (dreamProgress.find(p => p.dreamId === selectedDream.id)?.savedAmount || 0) : 0}
      />
    </div>
  );
};

export default CompletedScreen;