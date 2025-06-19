
"use client";

import React from 'react';

export default function SplashScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="animate-jrk-logo-pulse">
        {/* Using inline style for the specific logo color not in Tailwind theme */}
        <span 
          className="text-8xl font-bold font-headline" 
          style={{ color: '#79C84E' }}
          aria-label="JRK Logo"
        >
          JRK
        </span>
      </div>
    </div>
  );
}
