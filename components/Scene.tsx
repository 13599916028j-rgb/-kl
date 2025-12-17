import React, { useRef } from 'react';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import { TreeMode, HandPosition } from '../types';

interface SceneProps {
  mode: TreeMode;
  handPos: React.MutableRefObject<HandPosition>;
}

const Scene: React.FC<SceneProps> = ({ mode, handPos }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Smooth rotation state
  const targetRotation = useRef(new THREE.Vector2(0, 0));
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Logic for hand control
      if (handPos.current.active) {
        // Map hand (0..1) to rotation angles
        // Hand X controls Y rotation (horizontal look)
        // Hand Y controls X rotation (vertical tilt)
        // Invert X because moving hand right usually implies looking right (rotating object left) or moving camera right.
        // Let's rotate object: Hand Right -> Object rotates to show left side? 
        // Let's do: Hand Right -> Rotate Object Y positive.
        
        // Center is 0.5, 0.5
        const targetX = (handPos.current.y - 0.5) * 1.5; // Tilt up/down
        const targetY = (handPos.current.x - 0.5) * 1.5; // Rotate left/right
        
        targetRotation.current.set(targetX, targetY);
      } else {
        // Idle rotation if hand is not detected
        targetRotation.current.set(0, state.clock.getElapsedTime() * 0.1);
      }

      // Smooth interpolation (Lerp)
      const smoothing = 2.0;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.current.x, delta * smoothing);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, delta * smoothing);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 3}
        // We let hand control the object rotation, but user can still orbit if they want
      />
      
      {/* Lighting & Environment */}
      <Environment preset="lobby" />
      <ambientLight intensity={0.2} color="#001100" />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={2} castShadow color="#fffae0" />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#C5A000" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Main Tree Group - Rotated by Hand */}
      <group ref={groupRef}>
        <Foliage mode={mode} />
        <Ornaments mode={mode} />
      </group>

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

export default Scene;