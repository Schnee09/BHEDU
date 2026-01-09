"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowRight, Menu, X } from "lucide-react";

interface PublicHeaderProps {
    showNavLinks?: boolean;
}

export default function PublicHeader({ showNavLinks = true }: PublicHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: "/#features", label: "Tính năng" },
        { href: "/#about", label: "Giới thiệu" },
        { href: "/#contact", label: "Liên hệ" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#1A1410]/95 backdrop-blur-xl border-b border-amber-500/20 dark:border-amber-500/10 shadow-lg shadow-amber-500/5 dark:shadow-none">
            <div className="container flex h-20 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="relative w-12 h-12 bg-white dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/10 shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/20 transition-all duration-300 group-hover:scale-105">
                        <Image
                            src="/logo.png"
                            alt="Bùi Hoàng Logo"
                            fill
                            sizes="48px"
                            className="object-contain p-1"
                            priority
                        />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">BÙI</span>
                        <span className="font-black text-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 bg-clip-text text-transparent tracking-tight">HOÀNG</span>
                        <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-bold tracking-[0.25em] uppercase mt-1">Education</span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                {showNavLinks && (
                    <nav className="hidden md:flex items-center gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl transition-all duration-300 group"
                            >
                                {link.label}
                                {/* Hover Underline */}
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full group-hover:w-3/4 transition-all duration-300" />
                            </Link>
                        ))}
                    </nav>
                )}

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    {/* Login Button - Desktop */}
                    <Link href="/login" className="hidden sm:block">
                        <button className="relative px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:via-amber-700 hover:to-orange-600 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 flex items-center gap-2 cursor-pointer group overflow-hidden">
                            {/* Button Shine */}
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            <span className="relative z-10">Đăng Nhập</span>
                            <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#1A1410]/95 backdrop-blur-xl absolute w-full left-0 shadow-xl">
                    <nav className="container px-4 py-6 flex flex-col gap-2">
                        {showNavLinks && navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-4 py-3 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                <button className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold h-12 text-lg rounded-xl flex items-center justify-center">
                                    Đăng Nhập
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </button>
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
