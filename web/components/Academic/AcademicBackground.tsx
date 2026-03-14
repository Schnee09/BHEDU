"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useScroll } from 'framer-motion';

/**
 * AcademicBackground - A professional, technical background for educational contexts.
 * Focuses on clarity, structure, and subtle premium depth.
 */
export const AcademicBackground: React.FC = () => {
    const [isMounted, setIsMounted] = React.useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Subtle floating fragment counts
    const fragments = Array.from({ length: 12 });

    return (
        <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-background dark:bg-[#050505] transition-colors duration-500">
            {/* Atmospheric Depth - Multi-layered Corner Flares */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(circle_at_0%_0%,var(--color-primary),transparent_40%),radial-gradient(circle_at_100%_100%,var(--color-gold-accent),transparent_40%)]" />

            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] bg-[radial-gradient(circle_at_100%_0%,var(--color-red-600),transparent_30%)]" />

            {/* Subtle Ambient Depth */}
            <motion.div
                animate={{
                    x: [0, 50, -50, 0],
                    y: [0, -30, 30, 0],
                    opacity: [0.05, 0.1, 0.05]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{
                    x: [0, -80, 80, 0],
                    y: [0, 60, -60, 0],
                    opacity: [0.03, 0.08, 0.03]
                }}
                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gold-accent/5 rounded-full blur-[150px]"
            />

            {/* Client-side design elements - Wrapped in a stable container to preserve hydration structure */}
            <div className="absolute inset-0 pointer-events-none">
                {isMounted && fragments.map((_, i) => (
                    <DataFragment key={i} index={i} />
                ))}
            </div>

            {/* Focus Vignette - Position fixed relative to siblings */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
        </div>
    );
};

const DataFragment: React.FC<{ index: number }> = ({ index }) => {
    const randomX = Math.random() * 100;
    const randomY = Math.random() * 100;
    const randomRotation = Math.random() * 360;
    const randomDuration = 15 + Math.random() * 25;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{
                y: [0, -80, 0],
                x: [0, 40, 0],
                rotate: [randomRotation, randomRotation + 90],
                opacity: [0.1, 0.2, 0.1]
            }}
            transition={{
                duration: randomDuration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.8
            }}
            className="absolute glass-crystal"
            style={{
                left: `${randomX}%`,
                top: `${randomY}%`,
                width: `${30 + Math.random() * 50}px`,
                height: `1px`,
                transform: `rotate(${randomRotation}deg)`,
            }}
        />
    );
};
