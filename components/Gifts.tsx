
import React, { useMemo } from 'react';
import * as THREE from 'three';

export const Gifts: React.FC = () => {
  // Generate a procedural texture for the ribbons (diagonal stripes + noise)
  const ribbonTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; // Increased resolution
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        // 1. Base color (White/Light)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);
        
        // 2. Diagonal Stripes
        ctx.fillStyle = '#dedede'; 
        const step = 64;
        const stripeWidth = 32;
        
        ctx.beginPath();
        for (let i = -512; i < 1024; i += step) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 512, 512);
            ctx.lineTo(i + 512 + stripeWidth, 512);
            ctx.lineTo(i + stripeWidth, 0);
            ctx.closePath();
        }
        ctx.fill();
        
        // 3. Fabric Grain / Noise
        const imageData = ctx.getImageData(0, 0, 512, 512);
        const data = imageData.data;
        for(let i = 0; i < data.length; i += 4) {
             const noise = (Math.random() - 0.5) * 8; 
             data[i] = Math.max(0, Math.min(255, data[i] + noise));
             data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
             data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = 16;
    return tex;
  }, []);

  const gifts = useMemo(() => {
    const items = [];
    const colors = [
        '#d1001f', // Classic Red
        '#0d9488', // Teal
        '#d4af37', // Gold
        '#e2e8f0', // Silver
        '#1e293b', // Dark Blue
        '#701a75', // Deep Plum
        '#9f1239', // Rose Red
        '#fff1f2', // Champagne White
    ]; 
    const count = 30; // Increased count for abundance

    for (let i = 0; i < count; i++) {
      // Placement logic: Scatter around base
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.8);
      // Vary radius to create depth (pile effect)
      // Radius adjusted to ensure they sit outside the tree branches but close enough
      const radius = 6.0 + Math.random() * 3.5; 
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Three distinct box styles
      const type = Math.random();
      let width, height, depth;

      if (type > 0.66) {
          // Tall Box
          width = 0.6 + Math.random() * 0.4;
          depth = 0.6 + Math.random() * 0.4;
          height = 0.8 + Math.random() * 0.8;
      } else if (type > 0.33) {
          // Flat Box
          width = 1.0 + Math.random() * 0.8;
          depth = 0.8 + Math.random() * 0.6;
          height = 0.3 + Math.random() * 0.3;
      } else {
          // Cube-ish
          const s = 0.7 + Math.random() * 0.5;
          width = s; height = s; depth = s;
      }
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      let ribbonColor = colors[Math.floor(Math.random() * colors.length)];
      if (ribbonColor === color) ribbonColor = '#ffffff';

      // Random rotation
      const rotY = Math.random() * Math.PI * 2;
      // Slight random tilt for realism (like they are sitting on snow)
      const rotX = (Math.random() - 0.5) * 0.1;
      const rotZ = (Math.random() - 0.5) * 0.1;

      items.push({
        position: [x, height / 2, z] as [number, number, number],
        rotation: [rotX, rotY, rotZ] as [number, number, number],
        size: [width, height, depth] as [number, number, number],
        color,
        ribbonColor,
        isFoil: Math.random() > 0.3 // 70% chance of shiny foil wrapper
      });
    }
    return items;
  }, []);

  return (
    // Position adjusted to y=1.0 to align with the start of the ribbon on the tree
    <group position={[0, 1.0, 0]}>
      {/* Dedicated lights for the gifts to make them sparkle */}
      <pointLight position={[5, 2, 5]} intensity={0.5} color="#ffddaa" distance={10} />
      <pointLight position={[-5, 2, -5]} intensity={0.5} color="#aaddff" distance={10} />
      <pointLight position={[5, 2, -5]} intensity={0.5} color="#ffaaee" distance={10} />

      {gifts.map((gift, i) => (
        <group key={i} position={gift.position} rotation={gift.rotation}>
          {/* Main Box Wrapper */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={gift.size} />
            <meshStandardMaterial 
              color={gift.color} 
              roughness={gift.isFoil ? 0.2 : 0.8} 
              metalness={gift.isFoil ? 0.6 : 0.1}
              envMapIntensity={gift.isFoil ? 1.0 : 0.5}
            />
          </mesh>

          {/* Ribbon Band 1 */}
          <mesh position={[0, 0, 0]} scale={[1.02, 1.02, 0.15]}>
            <boxGeometry args={gift.size} />
            <meshStandardMaterial 
              color={gift.ribbonColor} 
              map={ribbonTexture}
              roughness={0.4} 
              metalness={0.2} 
            />
          </mesh>

          {/* Ribbon Band 2 */}
          <mesh position={[0, 0, 0]} scale={[0.15, 1.02, 1.02]}>
            <boxGeometry args={gift.size} />
            <meshStandardMaterial 
              color={gift.ribbonColor} 
              map={ribbonTexture}
              roughness={0.4} 
              metalness={0.2} 
            />
          </mesh>

          {/* 3D Bow Knot on Top */}
          <group position={[0, gift.size[1] / 2, 0]}>
             <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.3, 0.3, 0.1]}>
                <torusKnotGeometry args={[gift.size[0] * 0.6, 0.15, 64, 8, 2, 3]} />
                <meshStandardMaterial 
                    color={gift.ribbonColor} 
                    map={ribbonTexture}
                    roughness={0.3} 
                    metalness={0.3} 
                />
             </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};
