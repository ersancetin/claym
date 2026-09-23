import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  light?: boolean;
}

export function Logo({ className = "", iconOnly = false, light = false }: LogoProps) {
  const textColor = light ? "text-white" : "text-ink";
  
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
        >
          {/* Isometric Abstract Logo - Represents Structure, Dimensions & Calculation */}
          
          {/* Top Plane - Data/Cloud */}
          <path 
            d="M16 3L26.3923 9V10L16 16L5.6077 10V9L16 3Z" 
            fill={light ? "#93C5FD" : "#60A5FA"} 
          />
          
          {/* Right Plane - Strength/Structure */}
          <path 
            d="M26.3923 10V22L16 28V16L26.3923 10Z" 
            fill={light ? "#3B82F6" : "#2563EB"} 
          />
          
          {/* Left Plane - Depth/Foundation */}
          <path 
            d="M5.6077 10V22L16 28V16L5.6077 10Z" 
            fill={light ? "#60A5FA" : "#3B82F6"} 
          />
          
          {/* Center Core - AI/Focus */}
          <path 
            d="M16 16L21 13" 
            stroke="white" 
            strokeOpacity="0.3" 
            strokeWidth="1" 
          />
          <circle cx="16" cy="16" r="2" fill="white" fillOpacity="0.9" />
        </svg>
      </div>
      
      {!iconOnly && (
        <span className={`text-xl font-bold tracking-tight ${textColor} leading-none font-serif`}>
          Claym<span className={light ? "text-sky-300" : "text-brand"}>Hero</span>
        </span>
      )}
    </div>
  );
}