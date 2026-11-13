'use client';

import { motion, type HTMLMotionProps } from 'motion/react';

/** Fades and lifts its content in when it scrolls into view. */
export function Reveal({ delay = 0, y = 18, ...props }: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    />
  );
}

/** Animated page entrance for app screens. */
export function PageTransition(props: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  );
}
