"use client";

import { HTMLMotionProps, motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FabProps extends HTMLMotionProps<'button'> {
    icon: ReactNode;
    onClick: () => void;
    label?: string;
}

export function Fab({ icon, onClick, label, className = '', ...props }: FabProps) {
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onClick}
            className={`fixed bottom-8 right-6 z-30 flex items-center justify-center p-4 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 ring-4 ring-white/50 transition-colors hover:bg-primary-700 ${className}`}
            {...props}
        >
            {icon}
            {label && <span className="ml-2 font-semibold pr-2">{label}</span>}
        </motion.button>
    );
}
