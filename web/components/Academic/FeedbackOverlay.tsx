'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/ui/Icons';

interface FeedbackOverlayProps {
  isVisible: boolean;
  message?: string;
  onComplete?: () => void;
}

/**
 * FeedbackOverlay - Professional system confirmation overlay.
 * Replaces marketing-heavy overlays with a clean academic aesthetic.
 */
export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  isVisible,
  message = 'HỆ THỐNG ĐÃ XÁC NHẬN',
  onComplete,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={onComplete}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md overflow-hidden"
        >
          {/* Professional Scanline Confirmation */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '100%' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-x-0 h-0.5 bg-gold-accent shadow-accent-glow z-10"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="text-center space-y-8"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gold-accent/10 blur-2xl animate-pulse" />
              <Icons.Check className="w-20 h-20 text-gold-accent relative z-10" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-widest uppercase">
                {message}
              </h2>
              <p className="text-gold-accent font-mono text-xs tracking-[0.4em] uppercase opacity-60">
                TRANSACTIONAL CORE STABILITY VERIFIED
              </p>
            </div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '80%' }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-[1px] bg-gradient-to-r from-transparent via-gold-accent/50 to-transparent mx-auto"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
FeedbackOverlay.displayName = 'FeedbackOverlay';
