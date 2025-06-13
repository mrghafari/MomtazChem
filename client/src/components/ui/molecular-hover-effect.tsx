import { useState } from "react";

interface MolecularHoverEffectProps {
  children: React.ReactNode;
  className?: string;
  moleculeType?: 'benzene' | 'water' | 'ethanol' | 'methane' | 'ammonia';
}

const MolecularStructures = {
  benzene: (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-500">
      {/* Benzene ring */}
      <g className="animate-spin-slow">
        <circle cx="50" cy="20" r="3" fill="currentColor" className="animate-pulse">
          <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="75" cy="35" r="3" fill="currentColor" className="animate-pulse">
          <animate attributeName="r" values="2;4;2" dur="2s" begin="0.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="75" cy="65" r="3" fill="currentColor" className="animate-pulse">
          <animate attributeName="r" values="2;4;2" dur="2s" begin="0.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="80" r="3" fill="currentColor" className="animate-pulse">
          <animate attributeName="r" values="2;4;2" dur="2s" begin="0.9s" repeatCount="indefinite" />
        </circle>
        <circle cx="25" cy="65" r="3" fill="currentColor" className="animate-pulse">
          <animate attributeName="r" values="2;4;2" dur="2s" begin="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="25" cy="35" r="3" fill="currentColor" className="animate-pulse">
          <animate attributeName="r" values="2;4;2" dur="2s" begin="1.5s" repeatCount="indefinite" />
        </circle>
        
        {/* Bonds */}
        <line x1="50" y1="20" x2="75" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" strokeWidth="1" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" begin="0.3s" repeatCount="indefinite" />
        </line>
        <line x1="75" y1="65" x2="50" y2="80" stroke="currentColor" strokeWidth="1" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" begin="0.6s" repeatCount="indefinite" />
        </line>
        <line x1="50" y1="80" x2="25" y2="65" stroke="currentColor" strokeWidth="1" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" begin="0.9s" repeatCount="indefinite" />
        </line>
        <line x1="25" y1="65" x2="25" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" begin="1.2s" repeatCount="indefinite" />
        </line>
        <line x1="25" y1="35" x2="50" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" begin="1.5s" repeatCount="indefinite" />
        </line>
      </g>
    </svg>
  ),
  
  water: (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-500">
      {/* H2O molecule */}
      <g className="animate-bounce-slow">
        {/* Oxygen */}
        <circle cx="50" cy="50" r="6" fill="#ff4444" className="animate-pulse">
          <animate attributeName="r" values="5;8;5" dur="3s" repeatCount="indefinite" />
        </circle>
        {/* Hydrogen atoms */}
        <circle cx="30" cy="35" r="3" fill="#ffffff" className="animate-pulse">
          <animate attributeName="r" values="2;4;2" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="35" r="3" fill="#ffffff" className="animate-pulse">
          <animate attributeName="r" values="2;4;2" dur="3s" begin="1s" repeatCount="indefinite" />
        </circle>
        
        {/* Bonds */}
        <line x1="50" y1="50" x2="30" y2="35" stroke="#4444ff" strokeWidth="2" opacity="0.7">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="50" y1="50" x2="70" y2="35" stroke="#4444ff" strokeWidth="2" opacity="0.7">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </line>
      </g>
    </svg>
  ),
  
  ethanol: (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-500">
      {/* C2H5OH molecule */}
      <g className="animate-float">
        {/* Carbon atoms */}
        <circle cx="30" cy="50" r="4" fill="#333333">
          <animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="4" fill="#333333">
          <animate attributeName="r" values="3;5;3" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
        </circle>
        
        {/* Oxygen */}
        <circle cx="70" cy="50" r="4" fill="#ff4444">
          <animate attributeName="r" values="3;5;3" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
        </circle>
        
        {/* Hydrogen */}
        <circle cx="85" cy="50" r="2" fill="#ffffff">
          <animate attributeName="r" values="1.5;3;1.5" dur="2.5s" begin="0.9s" repeatCount="indefinite" />
        </circle>
        
        {/* Bonds */}
        <line x1="30" y1="50" x2="50" y2="50" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
        </line>
        <line x1="50" y1="50" x2="70" y2="50" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
        </line>
        <line x1="70" y1="50" x2="85" y2="50" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
        </line>
      </g>
    </svg>
  ),
  
  methane: (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-500">
      {/* CH4 molecule */}
      <g className="animate-spin-slow">
        {/* Carbon center */}
        <circle cx="50" cy="50" r="5" fill="#333333">
          <animate attributeName="r" values="4;6;4" dur="4s" repeatCount="indefinite" />
        </circle>
        
        {/* Hydrogen atoms */}
        <circle cx="50" cy="25" r="3" fill="#ffffff">
          <animate attributeName="r" values="2;4;2" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="75" cy="50" r="3" fill="#ffffff">
          <animate attributeName="r" values="2;4;2" dur="4s" begin="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="75" r="3" fill="#ffffff">
          <animate attributeName="r" values="2;4;2" dur="4s" begin="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="25" cy="50" r="3" fill="#ffffff">
          <animate attributeName="r" values="2;4;2" dur="4s" begin="3s" repeatCount="indefinite" />
        </circle>
        
        {/* Bonds */}
        <line x1="50" y1="50" x2="50" y2="25" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
        </line>
        <line x1="50" y1="50" x2="75" y2="50" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" begin="1s" repeatCount="indefinite" />
        </line>
        <line x1="50" y1="50" x2="50" y2="75" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" begin="2s" repeatCount="indefinite" />
        </line>
        <line x1="50" y1="50" x2="25" y2="50" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" begin="3s" repeatCount="indefinite" />
        </line>
      </g>
    </svg>
  ),
  
  ammonia: (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-500">
      {/* NH3 molecule */}
      <g className="animate-float">
        {/* Nitrogen */}
        <circle cx="50" cy="45" r="5" fill="#44ff44">
          <animate attributeName="r" values="4;6;4" dur="3.5s" repeatCount="indefinite" />
        </circle>
        
        {/* Hydrogen atoms */}
        <circle cx="35" cy="65" r="3" fill="#ffffff">
          <animate attributeName="r" values="2;4;2" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="25" r="3" fill="#ffffff">
          <animate attributeName="r" values="2;4;2" dur="3.5s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="65" cy="65" r="3" fill="#ffffff">
          <animate attributeName="r" values="2;4;2" dur="3.5s" begin="1s" repeatCount="indefinite" />
        </circle>
        
        {/* Bonds */}
        <line x1="50" y1="45" x2="35" y2="65" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.5s" repeatCount="indefinite" />
        </line>
        <line x1="50" y1="45" x2="50" y2="25" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.5s" begin="0.5s" repeatCount="indefinite" />
        </line>
        <line x1="50" y1="45" x2="65" y2="65" stroke="#4444ff" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.5s" begin="1s" repeatCount="indefinite" />
        </line>
      </g>
    </svg>
  ),
};

export default function MolecularHoverEffect({ 
  children, 
  className = "", 
  moleculeType = 'benzene' 
}: MolecularHoverEffectProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`group relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Molecular background effect */}
      <div className="absolute inset-0 pointer-events-none">
        {MolecularStructures[moleculeType]}
        
        {/* Particle effects */}
        {isHovered && (
          <div className="absolute inset-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-radial from-blue-400 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}