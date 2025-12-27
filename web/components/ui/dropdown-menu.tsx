"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface DropdownMenuProps {
    trigger: ReactNode;
    children: ReactNode;
    align?: "left" | "right";
    className?: string;
}

interface DropdownItemProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: "default" | "danger" | "warning";
    icon?: ReactNode;
}

export function DropdownMenu({ trigger, children, align = "right", className = "" }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !triggerRef.current?.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            // Calculate position
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const top = rect.bottom + window.scrollY + 4;
                // Basic alignment logic
                let left = rect.left + window.scrollX;
                if (align === "right") {
                    left = rect.right + window.scrollX - 200; // Assuming ~200px width
                }
                setCoords({ top, left });
            }
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, align]);

    // Handle scroll to update position if needed, or just close
    useEffect(() => {
        const handleScroll = () => {
            if (isOpen) setIsOpen(false);
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen]);

    const toggle = () => setIsOpen(!isOpen);

    return (
        <div className="relative inline-block text-left" ref={triggerRef}>
            <div onClick={toggle} className="cursor-pointer">
                {trigger}
            </div>
            {isOpen &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: "absolute",
                            top: coords.top,
                            left: coords.left,
                            zIndex: 9999,
                        }}
                        className={`
              w-48 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-scale-in
              bg-surface/95 backdrop-blur-xl border border-border
              ${className}
            `}
                    >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            {children}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}

export function DropdownItem({ children, onClick, className = "", variant = "default", icon }: DropdownItemProps) {
    let variantClasses = "text-foreground hover:bg-surface-secondary";
    if (variant === "danger") variantClasses = "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10";
    if (variant === "warning") variantClasses = "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10";

    return (
        <button
            onClick={onClick}
            className={`
        group flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors
        ${variantClasses}
        ${className}
      `}
            role="menuitem"
        >
            {icon && <span className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>}
            {children}
        </button>
    );
}
