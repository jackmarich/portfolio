'use client';

import { useTexture, RoundedBox } from '@react-three/drei';
import { Vector3, Group } from 'three';
import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';

// Texture names
const textureFiles = [
  'row-1-column-1.png', 'row-1-column-2.png', 'row-1-column-3.png',
  'row-2-column-1.png', 'row-2-column-2.png', 'row-2-column-3.png',
  'row-3-column-1.png', 'row-3-column-2.png', 'row-3-column-3.png',
];

interface CubieProps {
  position: [number, number, number]; // Logical position -1, 0, 1
  initialPosition: [number, number, number]; // To determine textures
}

// Standard Colors
const COLORS = {
  right: '#b90000', // Red
  left: '#ff5900',  // Orange
  up: '#ffffff',    // White
  down: '#ffd500',  // Yellow
  front: '#009b48', // Green
  back: '#0045ad',  // Blue
  internal: '#2a2a2a' // Black/Dark Grey - slightly lighter for definition
};

export const Cubie = forwardRef<Group, CubieProps>(({ position, initialPosition }, ref) => {
  const [x, y, z] = initialPosition;
  
  // Load all textures
  const textures = useTexture(textureFiles.map(f => `/face/${f}`));

  // Helper to get texture index (0-8) from row (1-3) and col (1-3)
  const getTex = (row: number, col: number) => textures[(row - 1) * 3 + (col - 1)];

  // Determine if face is visible and which texture to use
  const faces = useMemo(() => {
    const list = [];
    const gap = 0.5; // Distance from center to face (exact 0.5)

    // Right (x+)
    if (x === 1) {
      const col = z === 1 ? 1 : z === 0 ? 2 : 3;
      const row = y === 1 ? 1 : y === 0 ? 2 : 3;
      list.push({ dir: 'right', color: COLORS.right, texture: getTex(row, col), pos: [gap, 0, 0], rot: [0, Math.PI / 2, 0] });
    } else {
        // Render internal faces for structure? Usually not needed if cubes touch.
        // But if we rotate layers, we see internals.
        list.push({ dir: 'right', color: COLORS.internal, texture: null, pos: [gap, 0, 0], rot: [0, Math.PI / 2, 0] });
    }

    // Left (x-)
    if (x === -1) {
      const col = z === -1 ? 1 : z === 0 ? 2 : 3;
      const row = y === 1 ? 1 : y === 0 ? 2 : 3;
      list.push({ dir: 'left', color: COLORS.left, texture: getTex(row, col), pos: [-gap, 0, 0], rot: [0, -Math.PI / 2, 0] });
    } else {
        list.push({ dir: 'left', color: COLORS.internal, texture: null, pos: [-gap, 0, 0], rot: [0, -Math.PI / 2, 0] });
    }

    // Up (y+)
    if (y === 1) {
      const col = x === -1 ? 1 : x === 0 ? 2 : 3;
      const row = z === -1 ? 1 : z === 0 ? 2 : 3;
      list.push({ dir: 'up', color: COLORS.up, texture: getTex(row, col), pos: [0, gap, 0], rot: [-Math.PI / 2, 0, 0] });
    } else {
        list.push({ dir: 'up', color: COLORS.internal, texture: null, pos: [0, gap, 0], rot: [-Math.PI / 2, 0, 0] });
    }

    // Down (y-)
    if (y === -1) {
      const col = x === -1 ? 1 : x === 0 ? 2 : 3;
      const row = z === 1 ? 1 : z === 0 ? 2 : 3;
      list.push({ dir: 'down', color: COLORS.down, texture: getTex(row, col), pos: [0, -gap, 0], rot: [Math.PI / 2, 0, 0] });
    } else {
        list.push({ dir: 'down', color: COLORS.internal, texture: null, pos: [0, -gap, 0], rot: [Math.PI / 2, 0, 0] });
    }

    // Front (z+)
    if (z === 1) {
      const col = x === -1 ? 1 : x === 0 ? 2 : 3;
      const row = y === 1 ? 1 : y === 0 ? 2 : 3;
      list.push({ dir: 'front', color: COLORS.front, texture: getTex(row, col), pos: [0, 0, gap], rot: [0, 0, 0] });
    } else {
        list.push({ dir: 'front', color: COLORS.internal, texture: null, pos: [0, 0, gap], rot: [0, 0, 0] });
    }

    // Back (z-)
    if (z === -1) {
      const col = x === 1 ? 1 : x === 0 ? 2 : 3;
      const row = y === 1 ? 1 : y === 0 ? 2 : 3;
      list.push({ dir: 'back', color: COLORS.back, texture: getTex(row, col), pos: [0, 0, -gap], rot: [0, Math.PI, 0] });
    } else {
        list.push({ dir: 'back', color: COLORS.internal, texture: null, pos: [0, 0, -gap], rot: [0, Math.PI, 0] });
    }

    return list;
  }, [x, y, z, textures, getTex]);

  return (
    <group ref={ref} position={position}>
      {/* Base Cube - Rounded Black Plastic */}
      <RoundedBox args={[0.98, 0.98, 0.98]} radius={0.08} smoothness={4}>
        <meshPhysicalMaterial 
            color={COLORS.internal} 
            roughness={0.4} 
            metalness={0.1} 
            clearcoat={0.5}
        />
      </RoundedBox>

      {/* Faces with Stickers */}
      {faces.map((face, i) => (
        <group key={i} position={face.pos as [number, number, number]} rotation={face.rot as [number, number, number]}>
           {/* 1. The Colored Sticker/Plastic - Slightly glossy */}
           {face.color !== COLORS.internal && (
             <mesh position={[0, 0, 0.01]}> 
               <planeGeometry args={[0.88, 0.88]} /> 
               <meshPhysicalMaterial 
                color={face.color} 
                roughness={0.1} 
                metalness={0.1}
                clearcoat={1}
                clearcoatRoughness={0.1}
                polygonOffset
                polygonOffsetFactor={-1}
               />
             </mesh>
           )}

           {/* 2. The Face Image Overlay */}
           {face.texture && (
             <mesh position={[0, 0, 0.025]}>
               <planeGeometry args={[0.88, 0.88]} />
               <meshStandardMaterial 
                 map={face.texture} 
                 transparent 
                 opacity={1} 
                 depthTest={true}
                 depthWrite={false}
                 roughness={0.8}
                 metalness={0}
               />
             </mesh>
           )}
        </group>
      ))}
    </group>
  );
});

Cubie.displayName = 'Cubie';

