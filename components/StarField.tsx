
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarFieldProps {
  count?: number;
}

export const StarField: React.FC<StarFieldProps> = ({ count = 5000 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];
    const phases = [];
    const speeds = [];

    const colorPalette = [
      new THREE.Color('#ffffff'), // White
      new THREE.Color('#ffe9c4'), // Warm White
      new THREE.Color('#d4fbff'), // Blue-ish
      new THREE.Color('#ffd700'), // Gold
      new THREE.Color('#ffb7b2'), // Reddish
    ];

    for (let i = 0; i < count; i++) {
      // Random position in a large sphere
      const r = 100 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      // Random Color from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors.push(color.r, color.g, color.b);

      // Size variation
      sizes.push(0.5 + Math.random() * 2.0);

      // Twinkle properties
      phases.push(Math.random() * Math.PI * 2);
      speeds.push(0.5 + Math.random() * 3.0);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));

    return geo;
  }, [count]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1.0 }
    },
    vertexShader: `
      uniform float uTime;
      attribute float size;
      attribute vec3 color;
      attribute float aPhase;
      attribute float aSpeed;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Twinkle Logic
        float twinkle = sin(uTime * aSpeed + aPhase);
        // Map sine -1..1 to 0.3..1.0 opacity
        vAlpha = 0.65 + 0.35 * twinkle;
        
        // Scale size slightly with brightness
        float scale = 1.0 + 0.5 * twinkle;

        // Distance attenuation for size
        gl_PointSize = size * scale * (300.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        // Soft circular particle
        vec2 uv = gl_PointCoord.xy - 0.5;
        float dist = length(uv);
        if (dist > 0.5) discard;
        
        // Glow gradient
        float glow = 1.0 - (dist * 2.0);
        glow = pow(glow, 1.5);

        gl_FragColor = vec4(vColor, vAlpha * glow);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};
