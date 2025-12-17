import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRandomSpherePoint, getConePoint } from '../utils/math';
import { TreeMode } from '../types';

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  
  attribute vec3 aChaosPos;
  attribute vec3 aTargetPos;
  attribute float aRandom;
  
  varying vec3 vColor;
  varying float vAlpha;

  float easeInOutCubic(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
  }

  void main() {
    float t = uProgress;
    
    // Staggered animation based on random attribute
    float stagger = aRandom * 0.3;
    float localProgress = smoothstep(0.0, 1.0 - stagger, t);
    localProgress = easeInOutCubic(localProgress);

    vec3 pos = mix(aChaosPos, aTargetPos, localProgress);
    
    // Wind/Breathing effect
    if (uProgress > 0.8) {
      float wind = sin(uTime * 1.5 + pos.y * 0.5) * 0.05;
      pos.x += wind * (localProgress);
      pos.z += cos(uTime + pos.y) * 0.03 * (localProgress);
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    // Increased particle size slightly for fuller look
    gl_PointSize = (45.0 * aRandom + 20.0) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vec3 colorDeep = vec3(0.0, 0.2, 0.1); // Deeper Emerald
    vec3 colorLight = vec3(0.05, 0.4, 0.2); // Mid Green (less bright)
    vec3 colorGold = vec3(1.0, 0.85, 0.3); 

    float heightFactor = (pos.y + 5.0) / 10.0;
    // Bias towards deep color for "lush" look
    vec3 baseColor = mix(colorDeep, colorLight, heightFactor * 0.7);
    
    // Dynamic sparkle
    float sparkleRate = 3.0;
    float sparkle = sin(uTime * sparkleRate + aRandom * 123.0);
    
    // Add gold flecks that appear more when formed
    float goldMix = smoothstep(0.9, 1.0, sparkle) * localProgress;
    
    vColor = mix(baseColor, colorGold, goldMix);
    vAlpha = 1.0;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft glowy particle
    float alpha = smoothstep(0.5, 0.1, dist);
    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

interface FoliageProps {
  mode: TreeMode;
}

const COUNT = 35000; // Significantly increased for a fuller tree
const TREE_HEIGHT = 12;
const TREE_RADIUS = 5;
const CHAOS_RADIUS = 25;

const Foliage: React.FC<FoliageProps> = ({ mode }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
  }), []);

  const { chaosPositions, targetPositions, randoms } = useMemo(() => {
    const cPos = new Float32Array(COUNT * 3);
    const tPos = new Float32Array(COUNT * 3);
    const rands = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const chaos = getRandomSpherePoint(CHAOS_RADIUS);
      const target = getConePoint(TREE_HEIGHT, TREE_RADIUS);

      cPos.set(chaos, i * 3);
      tPos.set(target, i * 3);
      rands[i] = Math.random();
    }

    return { chaosPositions: cPos, targetPositions: tPos, randoms: rands };
  }, []);

  // Internal lerp state
  const currentProgress = useRef(0);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Logic: Lerp currentProgress towards target (0 or 1)
      const target = mode === 'FORMED' ? 1 : 0;
      const speed = 1.2;
      
      currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, target, delta * speed);

      meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
      meshRef.current.material.uniforms.uProgress.value = currentProgress.current;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={targetPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaosPos" count={COUNT} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aTargetPos" count={COUNT} array={targetPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={COUNT} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;