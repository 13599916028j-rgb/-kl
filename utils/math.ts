import * as THREE from 'three';

// Generate a random point inside a sphere
export const getRandomSpherePoint = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return [
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  ];
};

// Generate a point on a cone surface (The Tree)
// Height 12, Base Radius 5
export const getConePoint = (height: number, baseRadius: number): [number, number, number] => {
  const y = Math.random() * height; // 0 to height
  const progress = y / height; // 0 (bottom) to 1 (top)
  const r = baseRadius * (1 - progress); // Linear taper
  
  const theta = Math.random() * Math.PI * 2;
  
  // Increased noise for a fuller, bushier tree
  const noise = (Math.random() - 0.5) * 1.5; 
  
  const x = (r + noise) * Math.cos(theta);
  const z = (r + noise) * Math.sin(theta);
  
  // Center the tree vertically
  return [x, y - height / 2, z];
};

// Spiral distribution for ornaments
export const getSpiralPoint = (
  i: number, 
  total: number, 
  height: number, 
  baseRadius: number, 
  turns: number
): [number, number, number] => {
  const progress = i / total;
  const y = progress * height;
  const r = baseRadius * (1 - progress) + 0.2; // Slightly outside foliage
  const angle = progress * Math.PI * 2 * turns;
  
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  
  return [x, y - height / 2, z];
};