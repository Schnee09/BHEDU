'use client';

import React, { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export function QRCode({
  value,
  size = 120,
  className = '',
  darkColor = '#000000',
  lightColor = '#FFFFFF',
}: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    QRCodeLib.toDataURL(value, {
      width: size * 2, // High DPI
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('[QRCode] Generation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor]);

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] text-stone-400 font-bold">QR...</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR code for ${value}`}
      width={size}
      height={size}
      className={`object-contain rounded-lg ${className}`}
    />
  );
}

export default QRCode;
