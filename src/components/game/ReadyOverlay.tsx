import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadyOverlayProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export const ReadyOverlay: React.FC<ReadyOverlayProps> = ({ isVisible, onComplete }) => {
  const [countdown, setCountdown] = useState(2);
  const [showStart, setShowStart] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    if (!isVisible) {
      cleanup();
      setCountdown(2);
      setShowStart(false);
      return;
    }
    
    // Start countdown
    let currentCount = 2;
    
    timerRef.current = setInterval(() => {
      currentCount--;
      
      if (currentCount > 0) {
        setCountdown(currentCount);
      } else if (currentCount === 0) {
        setCountdown(0);
        setShowStart(true);
        cleanup();
        
        // Show "Start!" for a moment then complete
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    }, 1000);
    
    return cleanup;
  }, [isVisible, onComplete, cleanup]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {!showStart ? (
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-8xl font-bold text-white mb-4">
                  {countdown}
                </div>
                <div className="text-4xl font-semibold text-white/80">
                  Ready
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-6xl font-bold text-white"
              >
                Start!
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};