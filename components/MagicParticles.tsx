import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MagicParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  // Cinematic Shader for Golden Glimmer
  const magicMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      // Gold color boosted for HDR bloom (values > 1.0)
      uColor: { value: new THREE.Color(2.0, 1.5, 0.2) }, 
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;
      varying float vAlpha;

      void main() {
        vec3 pos = position;
        
        // Gentle upward drift
        float life = mod(uTime * aSpeed + aPhase, 10.0);
        pos.y += life;
        
        // Spiral motion
        float angle = uTime * 0.2 + aPhase;
        float radiusVariation = sin(uTime + aPhase) * 0.2;
        
        // Apply spiral offset to x and z
        // We keep the original 'cylinder' shape but rotate vertices slightly
        float c = cos(angle * 0.5);
        float s = sin(angle * 0.5);
        
        float x = pos.x;
        float z = pos.z;
        pos.x = x * c - z * s;
        pos.z = x * s + z * c;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Attenuate size by distance
        // SAFETY: Clamp size to avoid giant artifacts
        float distFactor = 20.0 / max(1.0, -mvPosition.z);
        gl_PointSize = min(250.0, aSize * distFactor);
        
        // Blink/Twinkle logic
        float twinkle = sin(uTime * 3.0 + aPhase * 10.0);
        vAlpha = 0.5 + 0.5 * twinkle;
        
        // Fade out at top and bottom of life cycle
        float fade = 1.0 - abs((life / 10.0) * 2.0 - 1.0);
        vAlpha *= fade;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      
      void main() {
        // Soft particle texture procedurally
        vec2 uv = gl_PointCoord.xy;
        float dist = length(uv - 0.5);
        
        if (dist > 0.5) discard;
        
        // intense center core
        // FIX: Clamp base to 0.0 before pow to avoid NaN black artifacts
        float core = max(0.0, 1.0 - (dist * 2.0));
        core = pow(core, 4.0);
        
        gl_FragColor = vec4(uColor, vAlpha * core);
      }
    `
  }), []);

  // Geometry: Particles distributed in a cylinder/cone around the tree
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 400;
    const positions = [];
    const sizes = [];
    const phases = [];
    const speeds = [];

    for (let i = 0; i < count; i++) {
      // Cone/Cylinder distribution
      const r = 1.0 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const h = Math.random() * 6.0; // Distribute vertically relative to tree base
      
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const y = h; // Start at different heights

      positions.push(x, y, z);
      sizes.push(5.0 + Math.random() * 10.0); // Base pixel size
      phases.push(Math.random() * 10.0);
      speeds.push(0.5 + Math.random() * 0.5);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));
    
    return geo;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      magicMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={magicMaterial} />;
};