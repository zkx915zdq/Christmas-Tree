
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SnowProps {
  count: number;
}

export const Snow: React.FC<SnowProps> = ({ count = 1000 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate a snowflake texture using a canvas
  const snowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        ctx.clearRect(0, 0, 32, 32);
        
        // Draw a simple white dot with soft edges (Snowflake particle)
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)'); // Center
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)'); // Core
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)'); // Falloff
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)'); // Edge
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const snowMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#ffffff') },
      uHeight: { value: 50.0 }, 
      uTexture: { value: snowTexture },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      uniform float uTime;
      uniform float uHeight;
      attribute float aSpeed;
      attribute float aRandom;
      attribute float aSize;
      
      void main() {
        vec3 pos = position;
        
        // Downward movement
        float fallSpeed = 3.0 * aSpeed;
        float yOffset = mod(pos.y - uTime * fallSpeed, uHeight);
        
        pos.y = yOffset - (uHeight / 2.0) + 10.0;
        
        // Turbulence / Swirling (Simulating Wind)
        float t = uTime * 0.5;
        // Large scale wind
        pos.x += sin(t + pos.y * 0.05) * 2.0;
        // Small scale flutter
        pos.x += cos(t * 3.0 + aRandom * 10.0) * 0.5;
        pos.z += sin(t * 2.0 + aRandom * 5.0) * 0.5;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Adjusted size multiplier for texture visibility
        gl_PointSize = aSize * (50.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform sampler2D uTexture;
      
      void main() {
        vec4 texColor = texture2D(uTexture, gl_PointCoord);
        if (texColor.a < 0.01) discard;
        gl_FragColor = vec4(uColor, texColor.a * 0.9);
      }
    `
  }), [snowTexture]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const speeds = [];
    const randoms = [];
    const sizes = [];
    const particleCount = count * 4; 

    for (let i = 0; i < particleCount; i++) {
      positions.push(
        Math.random() * 60 - 30,
        Math.random() * 50,
        Math.random() * 60 - 30
      );
      speeds.push(0.3 + Math.random() * 0.7);
      randoms.push(Math.random());
      // Smaller particle size for a cleaner look
      sizes.push(1.5 + Math.random() * 3.5);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));
    geo.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    
    return geo;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      snowMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={snowMaterial} />;
};
