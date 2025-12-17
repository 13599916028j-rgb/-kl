import * as THREE from 'three';
import React from 'react';

export type TreeMode = 'CHAOS' | 'FORMED';

export interface ParticleData {
  chaosPos: [number, number, number];
  targetPos: [number, number, number];
  color: string;
  size: number;
}

export interface OrnamentData {
  id: number;
  type: 'box' | 'ball' | 'light';
  chaosPos: [number, number, number];
  targetPos: [number, number, number];
  chaosRot: [number, number, number];
  targetRot: [number, number, number];
  color: string;
  scale: number;
}

export interface HandPosition {
  x: number; // 0 to 1
  y: number; // 0 to 1
  active: boolean;
}

// Shim for React Three Fiber intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      group: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      shaderMaterial: any;
      instancedMesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      boxGeometry: any;
    }
  }
}
