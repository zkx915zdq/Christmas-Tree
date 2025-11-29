
import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { PhotoPatch } from './PhotoPatch';
import { TopStar } from './TopStar';

interface ChristmasTreeProps {
  lightsOn: boolean;
  photoUrls: string[];
  ribbonAnimationTrigger: number;
  treeColor: string;
  ribbonColor: string;
  starColor: string;
}

export const ChristmasTree: React.FC<ChristmasTreeProps> = ({ 
  lightsOn, photoUrls, ribbonAnimationTrigger, treeColor, ribbonColor, starColor 
}) => {
  const treeRef = useRef<THREE.Points>(null);
  const ribbonParticlesRef = useRef<THREE.Points>(null);
  const treeHeight = 12;
  
  // Ribbon Animation State
  const ribbonGrowth = useRef(1.0); // 0 to 1
  
  // Photo Interaction State
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    // Reset growth when trigger changes
    if (ribbonAnimationTrigger > 0) {
      ribbonGrowth.current = 0.0;
    }
  }, [ribbonAnimationTrigger]);

  // --- GEOMETRY GENERATION ---
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const randoms: number[] = [];
    const phases: number[] = [];
    const types: number[] = []; // 0: Tree, 2: Bulb

    const pushParticle = (
      x: number, y: number, z: number, 
      c: THREE.Color, 
      s: number, 
      type: number
    ) => {
      // CRITICAL SAFETY CHECK: Skip invalid particles to prevent rendering glitches
      if (isNaN(x) || isNaN(y) || isNaN(z) || !isFinite(x) || !isFinite(y) || !isFinite(z)) return;
      if (isNaN(c.r) || isNaN(c.g) || isNaN(c.b)) return;

      positions.push(x, y, z);
      colors.push(c.r, c.g, c.b);
      sizes.push(s);
      randoms.push(Math.random());
      phases.push(Math.random() * Math.PI * 2);
      types.push(type);
    };

    const baseRadius = 5.0; 
    const treeParticles = 45000; 
    
    // Parse Colors
    const baseTreeColor = new THREE.Color(treeColor);
    const starLightColor = new THREE.Color(starColor).lerp(new THREE.Color('#ffffff'), 0.5);

    const layers = 16; 
    const layerHeight = treeHeight / layers;

    for (let i = 0; i < treeParticles; i++) {
      // INVERSE TRANSFORM SAMPLING for uniform density on a cone surface
      const rRand = 1.0 - Math.sqrt(Math.random());
      
      // CLAMP HEIGHT: Avoid the absolute tip (singularity) where radius -> 0
      // Also skip absolute bottom to avoid clipping with ground
      if (rRand < 0.02) continue; 
      if (rRand > 0.99) continue; // Explicitly clamp top to prevent NaNs

      const y = rRand * treeHeight;
      const hNorm = y / treeHeight;

      // Determine which layer we are in
      const tLayer = (y % layerHeight) / layerHeight; 

      // Branch Profile: Safe Math.pow
      const sineVal = Math.max(0, Math.sin(tLayer * Math.PI * 0.85));
      const branchProfile = 0.2 + 0.8 * Math.pow(sineVal, 1.2);

      // Radial Variation
      const numBranches = Math.floor(9 * (1.0 - hNorm * 0.6) + 4);
      const theta = Math.random() * Math.PI * 2;
      const radialWave = Math.cos(theta * numBranches + y * 0.5); 
      const radialProfile = 0.7 + 0.3 * radialWave;

      const coneR = baseRadius * (1.0 - hNorm);
      const maxR = coneR * branchProfile * radialProfile;

      // Safety check for tiny radius
      if (maxR < 0.01) continue;

      let rRatio = Math.pow(Math.random(), 0.3);
      if (Math.random() > 0.8) rRatio = Math.random(); 
      
      const r = maxR * rRatio;

      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      // --- COLORING & TYPE ---
      const color = new THREE.Color();
      
      const distFromSurface = r / maxR;
      
      let size = 1.0 + Math.random() * 2.5;
      let type = 0;

      // Check if we should place a BULB (Light)
      if (distFromSurface > 0.85 && Math.random() > 0.97) {
         type = 2; // Bulb
         size = 4.0 + Math.random() * 2.5;
         
         // Random Bulb Colors
         const bulbRand = Math.random();
         if (bulbRand > 0.83) color.setHex(0xff2222); // Red
         else if (bulbRand > 0.66) color.setHex(0x44ff44); // Green
         else if (bulbRand > 0.50) color.setHex(0xffd700); // Gold
         else if (bulbRand > 0.33) color.setHex(0x00ffff); // Cyan
         else if (bulbRand > 0.16) color.setHex(0xff00ff); // Magenta
         else color.setHex(0xffaa00); // Orange
      } 
      else if (distFromSurface > 0.9 && Math.random() > 0.85) {
         // TIPS - New Growth
         if (Math.random() > 0.7) {
            color.setHex(0xd1001f); // Red berries
         } else {
            // Lighter tip
            color.copy(baseTreeColor).offsetHSL(0, 0.2, 0.15); 
         }
      } else {
         // BODY OF TREE
         let shadow = 1.0;
         if (hNorm < 0.85) {
             const innerDarkness = rRatio < 0.4 ? 0.4 : 1.0;
             shadow = THREE.MathUtils.lerp(innerDarkness, 1.0, hNorm * 1.5);
         }

         const depth = distFromSurface; 
         const ambient = 0.2 + (hNorm * 0.6); 
         const diffuse = 0.2 + depth * 0.8;
         let brightness = Math.max(ambient, diffuse);

         // APEX HANDLING
         if (hNorm > 0.85) {
             brightness = 1.5 + (hNorm - 0.85) * 8.0;
             shadow = 1.0;
         }

         color.copy(baseTreeColor).multiplyScalar(brightness).multiplyScalar(shadow);
         
         // Star Light Injection
         if (hNorm > 0.75) {
             const proximityToStar = (hNorm - 0.75) / 0.25; 
             const glow = Math.pow(Math.max(0, proximityToStar), 2.5);
             const glowColor = starLightColor.clone().multiplyScalar(glow * 0.8);
             color.add(glowColor);
         }
      }
      
      pushParticle(x, y, z, color, size, type);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));
    geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
    geo.setAttribute('aType', new THREE.Float32BufferAttribute(types, 1));
    return geo;
  }, [treeColor, starColor]);

  // --- RIBBON PARTICLE GENERATION ---
  const ribbonParticleGeometry = useMemo(() => {
    const ribbonLoops = 5.5; 
    const ribbonStartY = 1.0; 
    const ribbonEndY = treeHeight - 1.2; 
    const angleOffset = Math.PI / 4;
    
    const segments = 1200;
    const particlesPerSegment = 8;
    
    const positions = [];
    const sizes = [];
    const phases = [];
    const progress = []; 

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        
        const y = THREE.MathUtils.lerp(ribbonStartY, ribbonEndY, t);
        const hNorm = y / treeHeight;
        const coneRadius = 5.0 * (1.0 - hNorm);
        
        const loopsDone = t * ribbonLoops; 
        const angle = loopsDone * Math.PI * 2 + angleOffset;
        
        const drapeFreq = 12.0; 
        const drapeAmp = 0.15;
        const yDrape = -Math.abs(Math.sin(loopsDone * Math.PI * drapeFreq)) * drapeAmp;

        const rWave = 0.05 * Math.sin(loopsDone * Math.PI * 6.0);
        // Extremely close to tree surface
        const centerR = coneRadius + 0.05 + rWave;
        
        // Safety check
        if (isNaN(centerR)) continue;

        const centerX = centerR * Math.cos(angle);
        const centerZ = centerR * Math.sin(angle);
        const centerY = y + yDrape;

        for (let j = 0; j < particlesPerSegment; j++) {
            const spread = 0.15; 
            const rndR = (Math.random() - 0.5) * spread;
            const rndY = (Math.random() - 0.5) * spread * 0.5;
            const rndAngle = (Math.random() - 0.5) * 0.2; 
            
            const px = (centerR + rndR) * Math.cos(angle + rndAngle);
            const pz = (centerR + rndR) * Math.sin(angle + rndAngle);
            const py = centerY + rndY;

            positions.push(px, py, pz);
            sizes.push(2.0 + Math.random() * 4.0);
            phases.push(Math.random() * 10.0);
            progress.push(t); 
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
    geo.setAttribute('aProgress', new THREE.Float32BufferAttribute(progress, 1));
    return geo;
  }, []);

  // --- TREE MATERIAL ---
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      
      attribute vec3 color;
      attribute float size;
      attribute float aRandom;
      attribute float aPhase;
      attribute float aType;
      
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        vColor = color;
        vec3 pos = position;
        
        // Gentle tree sway
        if (aType < 1.5) { 
           float sway = sin(uTime * 1.0 + pos.y * 0.3) * 0.06 * (pos.y / 12.0);
           pos.x += sway;
           pos.z += sway * 0.5;
        }
        
        float scale = 1.0;
        
        // Bulbs Blinking
        if (aType > 1.5) {
           float blink = sin(uTime * 3.0 + aPhase * 15.0);
           scale = 1.0 + blink * 0.4;
           
           float brightness = max(0.0, blink);
           vColor = mix(color, vec3(1.0, 1.0, 0.9), brightness * 0.6);
           vAlpha = 0.8 + 0.2 * blink;
        }
        else {
           // General Tree Shimmer
           scale = 1.0 + sin(uTime * 2.0 + aPhase) * 0.1;
           vAlpha = 0.85 + 0.15 * sin(uTime * 5.0 + aRandom * 10.0);
        }
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Safety: Prevent Infinite size when very close to camera
        // Clamp the distance factor or size. 
        // Max size clamped to 300.0 to prevent screen filling artifacts.
        float distFactor = 25.0 / max(1.0, -mvPosition.z);
        gl_PointSize = min(300.0, size * scale * distFactor);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        vec2 uv = gl_PointCoord.xy;
        float dist = length(uv - 0.5);
        if (dist > 0.5) discard;
        
        // FIX: Clamp base to 0.0 before pow to avoid NaN black artifacts
        float glow = max(0.0, 1.0 - (dist * 2.0));
        glow = pow(glow, 2.0);
        
        gl_FragColor = vec4(vColor, vAlpha * glow * uOpacity);
        // FINAL SAFETY CLAMP: Ensure no undefined colors
        gl_FragColor = clamp(gl_FragColor, 0.0, 1.0);
      }
    `,
  }), []);

  // --- RIBBON PARTICLE MATERIAL ---
  const ribbonMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uGrowth: { value: 1.0 }, 
      uRibbonColor: { value: new THREE.Color(ribbonColor) }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      uniform float uGrowth;
      uniform vec3 uRibbonColor;
      
      attribute float size;
      attribute float aPhase;
      attribute float aProgress;
      
      varying float vAlpha;
      varying vec3 vColor;
      
      void main() {
        float visibility = smoothstep(uGrowth + 0.05, uGrowth - 0.1, aProgress);
        if (aProgress > uGrowth) visibility = 0.0;
        else visibility = 1.0;
        
        vec3 pos = position;
        
        float flow = mod(uTime * 0.5 + aPhase, 1.0);
        pos.x += sin(uTime * 5.0 + aPhase) * 0.02;
        pos.z += cos(uTime * 5.0 + aPhase) * 0.02;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        float pulse = sin(uTime * 4.0 + aPhase * 2.0);
        float scale = 1.0 + 0.3 * pulse;
        
        float distFactor = 20.0 / max(1.0, -mvPosition.z);
        gl_PointSize = min(300.0, size * scale * visibility * distFactor);
        
        vec3 baseHDR = uRibbonColor * 2.0; 
        vec3 brightWhite = vec3(5.0, 5.0, 5.0); 
        float sparkle = smoothstep(0.4, 1.0, pulse);
        vColor = mix(baseHDR, brightWhite, sparkle * 0.7);
        
        vAlpha = visibility * (0.8 + 0.2 * pulse);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying vec3 vColor;
      
      void main() {
        if (vAlpha <= 0.01) discard;
        
        vec2 uv = gl_PointCoord.xy;
        float dist = length(uv - 0.5);
        if (dist > 0.5) discard;
        
        // FIX: Clamp base to 0.0 before pow to avoid NaN black artifacts
        float glow = max(0.0, 1.0 - (dist * 2.0));
        glow = pow(glow, 4.0);
        
        gl_FragColor = vec4(vColor, vAlpha * glow);
        gl_FragColor = clamp(gl_FragColor, 0.0, 1.0);
      }
    `
  }), []); // Removed ribbonColor dependency to prevent shader recompilation

  // Update uniforms when props change without recreating material
  useEffect(() => {
    ribbonMaterial.uniforms.uRibbonColor.value.set(ribbonColor);
  }, [ribbonColor, ribbonMaterial]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (treeRef.current) {
        material.uniforms.uTime.value = time;
        material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
            material.uniforms.uOpacity.value,
            lightsOn ? 1.0 : 0.05,
            0.05
        );
    }
    
    if (ribbonParticlesRef.current && lightsOn) {
        ribbonMaterial.uniforms.uTime.value = time;
        ribbonGrowth.current = THREE.MathUtils.lerp(ribbonGrowth.current, 1.0, 0.015);
        ribbonMaterial.uniforms.uGrowth.value = ribbonGrowth.current;
    }
  });

  // --- PHOTO PLACEMENT ---
  const photoPositions = useMemo(() => {
    return photoUrls.map((url, i) => {
        const seed = i * 999.99;
        const rand = (n: number) => {
            const x = Math.sin(seed + n) * 43758.5453;
            return x - Math.floor(x);
        };

        const yNorm = 0.1 + rand(0) * 0.75; 
        const y = yNorm * 12;

        const layers = 16;
        const layerHeight = 12 / layers;
        const tLayer = (y % layerHeight) / layerHeight;
        
        const adjustedY = y - (tLayer * layerHeight) + (0.6 * layerHeight);
        const finalHNorm = adjustedY / 12;

        const branchProfile = 0.2 + 0.8 * Math.pow(Math.sin(0.6 * Math.PI * 0.85), 1.2);
        const coneR = 5.0 * (1.0 - finalHNorm);
        
        const theta = rand(1) * Math.PI * 2;
        const rSurface = coneR * branchProfile;
        const depthOffset = (rand(2) * 0.2); 
        const r = rSurface + 0.2 + depthOffset; 

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        
        const rotY = -theta - Math.PI / 2 + (rand(3) - 0.5) * 0.3; 
        const rotX = -Math.atan(5.0/12.0) - 0.15 + (rand(4) - 0.5) * 0.2; 
        const rotZ = (rand(5) - 0.5) * 0.15; 

        return {
             pos: [x, adjustedY, z] as [number, number, number],
             rot: [rotX, rotY, rotZ] as [number, number, number],
             url
        };
    });
  }, [photoUrls]);

  // Handle dismiss click on background
  const dismissActivePhoto = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setActivePhotoIndex(null);
  }

  return (
    <group>
      {/* Invisible backdrop to detect clicks for dismissing photos */}
      <mesh visible={false} onClick={dismissActivePhoto} position={[0, 6, 0]}>
         <sphereGeometry args={[40, 16, 16]} />
         <meshBasicMaterial side={THREE.BackSide} />
      </mesh>

      <TopStar position={[0, treeHeight, 0]} color={starColor} />

      <points ref={treeRef} geometry={geometry} material={material} />

      {lightsOn && (
        <points ref={ribbonParticlesRef} geometry={ribbonParticleGeometry} material={ribbonMaterial} />
      )}

      {photoPositions.map((p, i) => (
         <PhotoPatch 
           key={i}
           url={p.url}
           position={p.pos}
           rotation={p.rot}
           size={[0.45, 0.525]} 
           opacity={lightsOn ? 1.0 : 0.0}
           isActive={activePhotoIndex === i}
           onClick={() => setActivePhotoIndex(prev => prev === i ? null : i)}
         />
      ))}
    </group>
  );
};
