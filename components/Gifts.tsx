
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface GiftsProps {
    isVisible?: boolean;
}

export const Gifts: React.FC<GiftsProps> = ({ isVisible = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const shadersRef = useRef<any[]>([]); // Use any[] for shaders to avoid type issues
  
  // Local growth state to sync with tree animation
  const currentGrowth = useRef(0);

  const ribbonTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; 
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);
        
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
        '#d1001f', '#0d9488', '#d4af37', '#e2e8f0', 
        '#1e293b', '#701a75', '#9f1239', '#fff1f2', 
    ]; 
    const count = 30; 

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.8);
      // Increased starting radius from 6.0 to 8.5 to accommodate 1.5x scaled tree
      const radius = 8.5 + Math.random() * 3.5; 
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const type = Math.random();
      let width, height, depth;

      if (type > 0.66) {
          width = 0.6 + Math.random() * 0.4;
          depth = 0.6 + Math.random() * 0.4;
          height = 0.8 + Math.random() * 0.8;
      } else if (type > 0.33) {
          width = 1.0 + Math.random() * 0.8;
          depth = 0.8 + Math.random() * 0.6;
          height = 0.3 + Math.random() * 0.3;
      } else {
          const s = 0.7 + Math.random() * 0.5;
          width = s; height = s; depth = s;
      }
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      let ribbonColor = colors[Math.floor(Math.random() * colors.length)];
      if (ribbonColor === color) ribbonColor = '#ffffff';

      const rotY = Math.random() * Math.PI * 2;
      const rotX = (Math.random() - 0.5) * 0.1;
      const rotZ = (Math.random() - 0.5) * 0.1;

      items.push({
        position: [x, height / 2, z] as [number, number, number],
        rotation: [rotX, rotY, rotZ] as [number, number, number],
        size: [width, height, depth] as [number, number, number],
        color,
        ribbonColor,
        isFoil: Math.random() > 0.3 
      });
    }
    return items;
  }, []);
  
  // Custom Shader Injection for Glitter Effect
  // Using 'any' for shader because THREE.Shader might not be exported in recent types
  const handleBeforeCompile = (shader: any) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uGlitterColor = { value: new THREE.Color('#ffcc00') }; // Golden Sparkle

    // Safe Injection using #include <common>
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec2 vGlitterUv;`
    );
    
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
       vGlitterUv = uv;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform float uTime;
       uniform vec3 uGlitterColor;
       varying vec2 vGlitterUv;

       float gRand(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
       }`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       
       // Procedural Glitter
       vec2 gUV = vGlitterUv * 40.0; 
       float gNoise = gRand(floor(gUV) + floor(uTime * 5.0));
       
       // Sparse threshold (only 2% pixels sparkle)
       float gSparkle = step(0.98, gNoise);
       
       // Soft pulsing
       float gPulse = 0.5 + 0.5 * sin(uTime * 3.0 + vGlitterUv.x * 10.0);
       
       // Add to emissive/base color
       gl_FragColor.rgb += uGlitterColor * gSparkle * gPulse * 0.8;
      `
    );

    shadersRef.current.push(shader);
  };

  useFrame((state) => {
     const time = state.clock.elapsedTime;
     
     // Update shaders
     shadersRef.current.forEach(shader => {
         shader.uniforms.uTime.value = time;
     });

     // Sync growth logic with Tree
     const target = isVisible ? 1.0 : 0.0;
     currentGrowth.current = THREE.MathUtils.lerp(currentGrowth.current, target, 0.02);

     if (groupRef.current) {
        // Gifts appear early in the sequence (0.05 to 0.2 growth range)
        const showThreshold = 0.05;
        
        let scale = 0;
        if (currentGrowth.current > showThreshold) {
            // Smooth pop in
            scale = THREE.MathUtils.smoothstep(currentGrowth.current, showThreshold, showThreshold + 0.2);
        }
        
        groupRef.current.scale.setScalar(scale);
        groupRef.current.visible = scale > 0.001;
     }
  });

  return (
    <group ref={groupRef} position={[0, 1.0, 0]} scale={[0,0,0]}>
      <pointLight position={[5, 2, 5]} intensity={0.5} color="#ffddaa" distance={10} castShadow shadow-bias={-0.001} />
      <pointLight position={[-5, 2, -5]} intensity={0.5} color="#aaddff" distance={10} castShadow shadow-bias={-0.001} />
      <pointLight position={[5, 2, -5]} intensity={0.5} color="#ffaaee" distance={10} castShadow shadow-bias={-0.001} />

      {gifts.map((gift, i) => (
        <group key={i} position={gift.position} rotation={gift.rotation}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={gift.size} />
            <meshStandardMaterial 
              color={gift.color} 
              roughness={gift.isFoil ? 0.2 : 0.8} 
              metalness={gift.isFoil ? 0.6 : 0.1}
              envMapIntensity={gift.isFoil ? 1.0 : 0.5}
              onBeforeCompile={handleBeforeCompile}
            />
          </mesh>

          <mesh position={[0, 0, 0]} scale={[1.02, 1.02, 0.15]} castShadow receiveShadow>
            <boxGeometry args={gift.size} />
            <meshPhysicalMaterial 
              color={gift.ribbonColor} 
              map={ribbonTexture}
              roughness={0.2} metalness={0.1} clearcoat={0.8} clearcoatRoughness={0.2}
              onBeforeCompile={handleBeforeCompile}
            />
          </mesh>

          <mesh position={[0, 0, 0]} scale={[0.15, 1.02, 1.02]} castShadow receiveShadow>
            <boxGeometry args={gift.size} />
            <meshPhysicalMaterial 
              color={gift.ribbonColor} 
              map={ribbonTexture}
              roughness={0.2} metalness={0.1} clearcoat={0.8} clearcoatRoughness={0.2}
              onBeforeCompile={handleBeforeCompile}
            />
          </mesh>

          <group position={[0, gift.size[1] / 2, 0]} scale={[gift.size[0] * 0.7, gift.size[0] * 0.7, gift.size[0] * 0.7]}>
            <meshPhysicalMaterial 
                color={gift.ribbonColor} 
                map={ribbonTexture}
                roughness={0.2} metalness={0.1} clearcoat={1.0} clearcoatRoughness={0.1}
                envMapIntensity={1.2} side={THREE.DoubleSide} attach="material"
                onBeforeCompile={handleBeforeCompile}
            />
            <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshPhysicalMaterial color={gift.ribbonColor} map={ribbonTexture} roughness={0.2} metalness={0.1} clearcoat={1.0} onBeforeCompile={handleBeforeCompile}/>
            </mesh>
            <mesh position={[-0.22, 0.15, 0]} rotation={[0, 0, Math.PI / 3]} scale={[1, 0.6, 1]} castShadow receiveShadow>
                <torusGeometry args={[0.25, 0.08, 16, 32]} />
                <meshPhysicalMaterial color={gift.ribbonColor} map={ribbonTexture} roughness={0.2} metalness={0.1} clearcoat={1.0} onBeforeCompile={handleBeforeCompile}/>
            </mesh>
            <mesh position={[0.22, 0.15, 0]} rotation={[0, 0, -Math.PI / 3]} scale={[1, 0.6, 1]} castShadow receiveShadow>
                <torusGeometry args={[0.25, 0.08, 16, 32]} />
                <meshPhysicalMaterial color={gift.ribbonColor} map={ribbonTexture} roughness={0.2} metalness={0.1} clearcoat={1.0} onBeforeCompile={handleBeforeCompile}/>
            </mesh>
            <mesh position={[-0.2, 0.05, 0.15]} rotation={[0.5, 0, 0.5]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 0.5, 0.02]} />
                <meshPhysicalMaterial color={gift.ribbonColor} map={ribbonTexture} roughness={0.2} metalness={0.1} clearcoat={1.0} onBeforeCompile={handleBeforeCompile}/>
            </mesh>
            <mesh position={[0.2, 0.05, 0.15]} rotation={[0.5, 0, -0.5]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 0.5, 0.02]} />
                <meshPhysicalMaterial color={gift.ribbonColor} map={ribbonTexture} roughness={0.2} metalness={0.1} clearcoat={1.0} onBeforeCompile={handleBeforeCompile}/>
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};
