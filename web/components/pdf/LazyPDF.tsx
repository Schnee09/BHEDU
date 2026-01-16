'use client';

/**
 * Lazy-loaded PDF Components
 * 
 * These wrappers ensure @react-pdf/renderer (~500KB) is only loaded
 * when the user actually needs to view or download PDFs.
 */

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Loading skeleton for PDF viewer
const PDFLoadingSkeleton = () => (
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-[600px] flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">Đang tải trình xem PDF...</span>
        </div>
    </div>
);

// Lazy load PDF viewer
export const LazyPDFViewer = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    {
        ssr: false,
        loading: () => <PDFLoadingSkeleton />
    }
);

// Lazy load PDF download link
export const LazyPDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => (
            <button
                disabled
                className="px-6 py-3 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
            >
                Đang tải...
            </button>
        )
    }
);

// Lazy load HocBaDocument - the actual PDF template
export const LazyHocBaDocument = dynamic(
    () => import('@/components/pdf/HocBaTemplate').then((mod) => mod.HocBaDocument),
    { ssr: false }
);

// Re-export TranscriptData type
export type { TranscriptData } from '@/components/pdf/HocBaTemplate';
