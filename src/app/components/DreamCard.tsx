import React from 'react';
import { Dream, DreamProgress } from '../types';
import { motion } from 'motion/react';

interface DreamCardProps {
  dream: Dream;
  progress?: DreamProgress;
  rotation: number;
  onClick: () => void;
}

const DreamCard: React.FC<DreamCardProps> = ({ dream, progress, rotation, onClick }) => {
  const progressPercent = dream.price && progress
    ? Math.min(Math.round((progress.savedAmount / dream.price) * 100), 100)
    : null;

  // Определяем, мобильное ли устройство
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <motion.div
      initial={{ rotate: isMobile ? 0 : rotation }} // На мобилке убираем ротацию
      whileHover={isMobile ? {} : { scale: 1.05, rotate: 0, zIndex: 10 }} // На мобилке нет hover
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="relative cursor-pointer group overflow-hidden shadow-md group-hover:shadow-2xl transition-shadow duration-300"
      style={{ 
        aspectRatio: '3/4',
        transformOrigin: 'center center',
        borderRadius: '15px',
        maxWidth: '100%',
        width: isMobile ? '100%' : 'auto',
      }}
    >
      <div className="w-full h-full relative">
        {/* Image с fallback */}
        <img
          src={dream.image || '/placeholder.png'} // Добавь placeholder на случай ошибки
          alt={dream.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Progress Badge */}
        {progressPercent !== null && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm font-medium">
            {progressPercent}%
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="text-xs uppercase tracking-wider mb-1 opacity-80">
            {dream.tag}
          </div>
          <h3
            className="text-xl line-clamp-2" // Добавил line-clamp чтобы текст не вылезал
            style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}
          >
            {dream.title}
          </h3>
        </div>
      </div>
    </motion.div>
  );
};

export default DreamCard;