import React, { useState, Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import Scene from './components/Scene';
import UI from './components/UI';
import HandController from './components/HandController';
import { TreeMode, HandPosition } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<TreeMode>('FORMED');
  
  // Use a ref for high-frequency updates (60fps) to avoid React re-renders causing lag
  const handPosRef = useRef<HandPosition>({ x: 0.5, y: 0.5, active: false });

  const handleHandMove = useCallback((pos: HandPosition) => {
    handPosRef.current = pos;
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#020403]">
      <HandController setMode={setMode} onHandMove={handleHandMove} />
      <UI mode={mode} setMode={setMode} />
      
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
            antialias: false,
            powerPreference: "high-performance",
            toneMappingExposure: 1.5
        }}
      >
        <Suspense fallback={null}>
          <Scene mode={mode} handPos={handPosRef} />
        </Suspense>
      </Canvas>
      
      <Loader 
        containerStyles={{ background: '#020403' }}
        innerStyles={{ width: '200px', height: '2px', background: '#333' }}
        barStyles={{ height: '2px', background: '#C5A000' }}
        dataStyles={{ fontFamily: 'Cinzel', color: '#C5A000', fontSize: '12px' }}
      />
    </div>
  );
};

export default App;