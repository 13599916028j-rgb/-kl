import React from 'react';
import { TreeMode } from '../types';

interface UIProps {
  mode: TreeMode;
  setMode: (mode: TreeMode) => void;
}

const UI: React.FC<UIProps> = ({ mode, setMode }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Header */}
      <div className="flex flex-col items-center animate-fade-in">
        <h1 className="font-luxury text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFF8E7] to-[#C5A000] drop-shadow-lg tracking-widest text-center">
          MERRY CHRISTMAS
        </h1>
        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#C5A000] to-transparent mt-4"></div>
        <p className="font-body text-[#ffeaa7] mt-2 text-sm tracking-widest uppercase opacity-80">
          Grand Luxury Edition
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-8 mb-8 pointer-events-auto">
        <button
          onClick={() => setMode('CHAOS')}
          className={`
            font-luxury px-8 py-3 border border-[#C5A000] transition-all duration-500
            ${mode === 'CHAOS' 
              ? 'bg-[#C5A000] text-black shadow-[0_0_20px_rgba(197,160,0,0.6)]' 
              : 'bg-black/50 text-[#C5A000] hover:bg-[#C5A000]/20 backdrop-blur-md'}
            uppercase tracking-widest text-sm md:text-base
          `}
        >
          Unleash Chaos
        </button>

        <button
          onClick={() => setMode('FORMED')}
          className={`
            font-luxury px-8 py-3 border border-[#C5A000] transition-all duration-500
            ${mode === 'FORMED' 
              ? 'bg-[#C5A000] text-black shadow-[0_0_20px_rgba(197,160,0,0.6)]' 
              : 'bg-black/50 text-[#C5A000] hover:bg-[#C5A000]/20 backdrop-blur-md'}
            uppercase tracking-widest text-sm md:text-base
          `}
        >
          Build the Tree
        </button>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-4 left-4 text-[#C5A000]/30 font-luxury text-xs">
        EST. 2024 • LUXURY COLLECTION
      </div>
    </div>
  );
};

export default UI;