import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface CompletionCameraProps {
  isOpen: boolean;
  dreamImage: string;
  dreamTitle: string;
  onComplete: () => void;
}

const CompletionCamera: React.FC<CompletionCameraProps> = ({
  isOpen,
  dreamImage,
  dreamTitle,
  onComplete,
}) => {
  const [step, setStep] = useState<'idle' | 'shoot' | 'eject' | 'develop' | 'ready' | 'flyaway'>('idle');
  const [photoRotation, setPhotoRotation] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep('idle');
      setPhotoRotation(0);
      return;
    }

    // Simple sequence
    const timeline = [
      { delay: 500, action: () => setStep('shoot') },  // Flash + shutter
      { delay: 1000, action: () => setStep('eject') }, // Polaroid slides out
      { delay: 3500, action: () => setStep('develop') }, // Image develops
      { delay: 6000, action: () => setStep('ready') }, // Pin appears, ready to click
    ];

    const timeouts = timeline.map(({ delay, action }) =>
      setTimeout(action, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [isOpen]);

  // Play elegant shutter sound
  useEffect(() => {
    if (step === 'shoot') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.15);
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, [step]);

  const handlePhotoClick = () => {
    if (step !== 'ready') return;
    
    // Just trigger onComplete - parent will handle navigation
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center"
        onClick={step === 'ready' ? handlePhotoClick : undefined}
      >
        {/* Close button */}
        <button
          onClick={onComplete}
          className="absolute top-6 right-6 p-2 hover:bg-muted rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Camera */}
        <motion.div
          initial={{ scale: 1, y: 0, opacity: 1 }}
          animate={{
            scale: step === 'idle' ? 1 : 0.6,
            y: step === 'idle' ? 0 : -120,
            opacity: step === 'idle' ? 1 : 0.3,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute"
        >
          <div className="relative w-[280px] h-[220px]">
            {/* Camera body */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 rounded-[20px] shadow-2xl">
              <div className="absolute inset-2 bg-gradient-to-br from-white to-gray-50 rounded-[16px]">
                {/* Lens */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-black shadow-lg">
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-900 to-black">
                    <div className="absolute inset-3 rounded-full bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
                  </div>
                </div>

                {/* Flash */}
                <motion.div
                  animate={step === 'shoot' ? { opacity: [0, 1, 0] } : {}}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-yellow-100/0 rounded-[16px] pointer-events-none"
                />
                <div className="absolute top-6 right-8 w-6 h-4 rounded-sm bg-gradient-to-b from-yellow-100 to-yellow-200 shadow-inner" />

                {/* Shutter button */}
                <div className="absolute top-6 left-8 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-red-400 to-red-500" />
                </div>

                {/* Brand */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-400 tracking-widest">
                  DREAMCAM
                </div>
              </div>
            </div>

            {/* Film slot */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-2 bg-gray-800 rounded-b-sm" />
          </div>
        </motion.div>

        {/* Polaroid + Photo */}
        <AnimatePresence>
          {(step === 'eject' || step === 'develop' || step === 'ready' || step === 'flyaway') && (
            <motion.div
              initial={{ y: -150, opacity: 0 }}
              animate={step === 'flyaway' ? {
                x: [0, -100, 100, -50, 50, -window.innerWidth / 3],
                y: [0, 20, -10, 15, -5, window.innerHeight / 3],
                scale: 0.5,
                rotate: [0, -8, 12, -6, 10, photoRotation],
                opacity: 1,
              } : {
                y: 80,
                opacity: 1,
              }}
              transition={step === 'flyaway' ? {
                duration: 1.2,
                ease: 'easeInOut',
                x: { duration: 1.2, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                y: { duration: 1.2, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                rotate: { duration: 1.2, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
              } : {
                duration: 1.2,
                ease: 'easeOut',
              }}
              className="relative"
            >
              {/* Pin (appears when ready) */}
              <AnimatePresence>
                {(step === 'ready' || step === 'flyaway') && (
                  <motion.div
                    initial={{ y: -30, opacity: 0, scale: 0 }}
                    animate={{ y: -12, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute left-1/2 -translate-x-1/2 z-20"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-xl">
                      <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-red-400 to-red-500" />
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-gray-400 to-gray-500" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Polaroid frame (fades out when ready) */}
              <motion.div
                animate={{ opacity: step === 'ready' || step === 'flyaway' ? 0 : 1 }}
                transition={{ duration: 0.6 }}
                className="relative bg-white shadow-2xl p-3 pb-14"
                style={{ width: '320px' }}
              >
                {/* Photo area */}
                <div className="relative w-full h-[300px] bg-gray-900 overflow-hidden">
                  <img
                    src={dreamImage}
                    alt={dreamTitle}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Developing overlay */}
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: step === 'develop' || step === 'ready' || step === 'flyaway' ? 0 : 1 }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-600"
                  />
                </div>

                {/* Caption */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: step === 'develop' ? 1 : 0 }}
                  className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-600 font-light tracking-wide px-4"
                >
                  Dream completed
                </motion.p>
              </motion.div>

              {/* Photo only (appears when ready, replacing polaroid) */}
              <AnimatePresence>
                {(step === 'ready' || step === 'flyaway') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-white shadow-2xl p-3 cursor-pointer"
                    onClick={handlePhotoClick}
                  >
                    <img
                      src={dreamImage}
                      alt={dreamTitle}
                      className="w-full h-[300px] object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint */}
        <AnimatePresence>
          {step === 'ready' && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-12 text-muted-foreground text-sm"
            >
              Tap anywhere to continue
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompletionCamera;