import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRandomSpherePoint, getSpiralPoint } from '../utils/math';
import { TreeMode } from '../types';

interface OrnamentsProps {
  mode: TreeMode;
}

const TREE_HEIGHT = 12;
const TREE_RADIUS = 5;
const CHAOS_RADIUS = 20;

const tempObj = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();

// --- POLAROID SHADERS ---
const polaroidVertexShader = `
  varying vec2 vUv;
  varying vec3 vColor;
  
  void main() {
    vUv = uv;
    
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #else
      vColor = vec3(1.0);
    #endif

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const polaroidFragmentShader = `
  varying vec2 vUv;
  varying vec3 vColor;

  void main() {
    // Polaroid Frame Logic
    float mx = 0.08;
    float myTop = 0.08;
    float myBot = 0.25;
    
    float inX = step(mx, vUv.x) * step(vUv.x, 1.0 - mx);
    float inY = step(myBot, vUv.y) * step(vUv.y, 1.0 - myTop);
    float isPhoto = inX * inY;
    
    // Warm/Creamy Gold-tinted paper frame for luxury feel
    vec3 paperColor = vec3(1.0, 0.98, 0.92);
    
    // Vignette for the photo area
    vec2 center = vec2(0.5, (1.0 - myTop + myBot) * 0.5);
    float dist = distance(vUv, center);
    vec3 photoColor = vColor * (1.2 - dist * 1.2); 
    
    vec3 finalColor = mix(paperColor, photoColor, isPhoto);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const Ornaments: React.FC<OrnamentsProps> = ({ mode }) => {
  const baubleMeshRef = useRef<THREE.InstancedMesh>(null);
  const boxMeshRef = useRef<THREE.InstancedMesh>(null);
  const polaroidMeshRef = useRef<THREE.InstancedMesh>(null);
  const currentProgress = useRef(0);
  
  const BAUBLE_COUNT = 200;
  const BOX_COUNT = 50;
  const POLAROID_COUNT = 45; // Reduced from 150

  const baubleData = useMemo(() => {
    return Array.from({ length: BAUBLE_COUNT }).map((_, i) => {
      const chaosPos = getRandomSpherePoint(CHAOS_RADIUS);
      const targetPos = getSpiralPoint(i, BAUBLE_COUNT, TREE_HEIGHT, TREE_RADIUS, 6);
      return {
        chaosPos: new THREE.Vector3(...chaosPos),
        targetPos: new THREE.Vector3(...targetPos),
        chaosRot: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0),
        targetRot: new THREE.Euler(0, Math.random()*Math.PI*2, 0),
        scale: Math.random() * 0.3 + 0.15,
        color: Math.random() > 0.4 ? new THREE.Color('#FFD700') : new THREE.Color('#990000'),
        speed: Math.random() * 0.5 + 0.5
      };
    });
  }, []);

  const boxData = useMemo(() => {
    return Array.from({ length: BOX_COUNT }).map((_, i) => {
      const chaosPos = getRandomSpherePoint(CHAOS_RADIUS);
      const theta = (i / BOX_COUNT) * Math.PI * 2;
      const r = Math.random() * 3 + 2.5;
      const targetPos = [r * Math.cos(theta), -TREE_HEIGHT/2 - 0.2, r * Math.sin(theta)];
      return {
        chaosPos: new THREE.Vector3(...chaosPos),
        targetPos: new THREE.Vector3(...targetPos),
        chaosRot: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0),
        targetRot: new THREE.Euler(0, theta + Math.random(), 0),
        scale: Math.random() * 0.6 + 0.4,
        color: new THREE.Color('#C5A000'), 
        speed: Math.random() * 0.2 + 0.8
      };
    });
  }, []);

  const polaroidData = useMemo(() => {
    return Array.from({ length: POLAROID_COUNT }).map((_, i) => {
        const chaosPos = getRandomSpherePoint(CHAOS_RADIUS);
        
        // Use spiral distribution similar to baubles but with different turns
        // to make them follow the "gold balls" path
        const targetPosArr = getSpiralPoint(i, POLAROID_COUNT, TREE_HEIGHT, TREE_RADIUS, 4.5);
        const [tx, ty, tz] = targetPosArr;
        
        // Push slightly further out than baubles so they dangle visibly
        const angle = Math.atan2(tz, tx);
        const r = Math.sqrt(tx * tx + tz * tz) + 0.3; 
        
        const targetPos = new THREE.Vector3(
          r * Math.cos(angle),
          ty,
          r * Math.sin(angle)
        );

        // Gold/Sepia/Luxury Photo Colors
        const colors = [
          '#FFD700', // Gold
          '#DAA520', // Goldenrod
          '#C5A000', // Dark Gold
          '#F0E68C', // Khaki
          '#B8860B'  // Dark Goldenrod
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        return {
            chaosPos: new THREE.Vector3(...chaosPos),
            targetPos: targetPos,
            chaosRot: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI),
            // Face outwards based on angle
            targetRot: new THREE.Euler(0, -angle + Math.PI/2, Math.random() * 0.1 - 0.05),
            scale: 1.0,
            color: new THREE.Color(randomColor),
            speed: Math.random() * 0.3 + 0.6
        };
    });
  }, []);

  useLayoutEffect(() => {
    if (baubleMeshRef.current) {
      baubleData.forEach((data, i) => baubleMeshRef.current!.setColorAt(i, data.color));
      baubleMeshRef.current.instanceColor!.needsUpdate = true;
    }
    if (boxMeshRef.current) {
      boxData.forEach((data, i) => boxMeshRef.current!.setColorAt(i, data.color));
      boxMeshRef.current.instanceColor!.needsUpdate = true;
    }
    if (polaroidMeshRef.current) {
        polaroidData.forEach((data, i) => polaroidMeshRef.current!.setColorAt(i, data.color));
        polaroidMeshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [baubleData, boxData, polaroidData]);

  useFrame((state, delta) => {
    // Animate global progress
    const target = mode === 'FORMED' ? 1 : 0;
    const lerpSpeed = 0.8; 
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, target, delta * lerpSpeed);
    const progress = currentProgress.current;

    const t = state.clock.getElapsedTime();
    
    // Baubles
    if (baubleMeshRef.current) {
      baubleData.forEach((data, i) => {
        const localP = THREE.MathUtils.smoothstep(progress, 0.0, 1.0);
        
        tempVec3.lerpVectors(data.chaosPos, data.targetPos, localP);
        if (progress > 0.8) tempVec3.y += Math.sin(t * 2 + i) * 0.05;

        if (progress < 0.2) {
             tempObj.rotation.x = data.chaosRot.x + t;
             tempObj.rotation.y = data.chaosRot.y + t;
        } else {
             tempObj.rotation.copy(data.targetRot);
             tempObj.rotation.y += Math.sin(t * 0.5 + i) * 0.2;
        }

        tempObj.position.copy(tempVec3);
        tempObj.scale.setScalar(data.scale * (0.8 + 0.2 * Math.sin(t + i)));
        tempObj.updateMatrix();
        baubleMeshRef.current!.setMatrixAt(i, tempObj.matrix);
      });
      baubleMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Boxes
    if (boxMeshRef.current) {
      boxData.forEach((data, i) => {
        const localP = THREE.MathUtils.smoothstep(progress, 0.2, 1.0);
        
        tempVec3.lerpVectors(data.chaosPos, data.targetPos, localP);
        tempObj.rotation.copy(data.targetRot);
        if (progress < 0.8) {
             tempObj.rotation.x += t;
             tempObj.rotation.z += t;
        }
        
        tempObj.position.copy(tempVec3);
        tempObj.scale.setScalar(data.scale);
        tempObj.updateMatrix();
        boxMeshRef.current!.setMatrixAt(i, tempObj.matrix);
      });
      boxMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Polaroids
    if (polaroidMeshRef.current) {
        polaroidData.forEach((data, i) => {
            const localP = THREE.MathUtils.smoothstep(progress, 0.1, 0.9);
            
            tempVec3.lerpVectors(data.chaosPos, data.targetPos, localP);
            
            // Random floating in chaos
            if (progress < 0.2) {
                tempObj.rotation.x = data.chaosRot.x + t * 0.5;
                tempObj.rotation.z = data.chaosRot.z + t * 0.3;
            } else {
                tempObj.rotation.copy(data.targetRot);
                // Gentle swaying
                tempObj.rotation.z += Math.sin(t * 1.5 + i) * 0.08;
            }

            tempObj.position.copy(tempVec3);
            tempObj.scale.setScalar(0.7); // Polaroid size
            tempObj.updateMatrix();
            polaroidMeshRef.current!.setMatrixAt(i, tempObj.matrix);
        });
        polaroidMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={baubleMeshRef} args={[undefined, undefined, BAUBLE_COUNT]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial roughness={0.05} metalness={1.0} envMapIntensity={3.0} />
      </instancedMesh>

      <instancedMesh ref={boxMeshRef} args={[undefined, undefined, BOX_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.15} metalness={0.9} envMapIntensity={2.0} />
      </instancedMesh>

      <instancedMesh ref={polaroidMeshRef} args={[undefined, undefined, POLAROID_COUNT]}>
          {/* Polaroid shape: Width 0.8, Height 1.0, Thin */}
          <boxGeometry args={[0.8, 1.0, 0.05]} />
          <shaderMaterial 
            vertexShader={polaroidVertexShader}
            fragmentShader={polaroidFragmentShader}
          />
      </instancedMesh>
    </>
  );
};

export default Ornaments;