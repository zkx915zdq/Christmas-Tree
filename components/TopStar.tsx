
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface TopStarProps {
  position: [number, number, number];
  color?: string;
  visible?: boolean; // Corresponds to isExperienceActive
}

export const TopStar: React.FC<TopStarProps> = ({ position, color = '#ffaa00', visible = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(0);
  
  // Local growth state
  const currentGrowth = useRef(0);
  
  // 1. Solid Geometry (Sharper Prismatic Star)
  const solidGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    const numPoints = 5;
    const outerRadius = 0.45; 
    const innerRadius = 0.16;
    const depth = 0.15; 

    // Center vertices (Front and Back peaks)
    vertices.push(0, 0, depth);  // Front Center (0)
    vertices.push(0, 0, -depth); // Back Center (1)

    // Generate ring vertices
    for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI) / numPoints + Math.PI / 2;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        vertices.push(x, y, 0);
    }

    // Build Faces
    for (let i = 0; i < numPoints * 2; i++) {
        const currentRingIndex = 2 + i;
        const nextRingIndex = 2 + ((i + 1) % (numPoints * 2));
        indices.push(0, currentRingIndex, nextRingIndex);
        indices.push(1, nextRingIndex, currentRingIndex);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 4. Sparkle Material (Ambient)
  const sparkleMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uScale: { value: 0 }, // animate shader scale too
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      uniform float uScale;
      attribute float aSize;
      attribute float aPhase;
      varying float vAlpha;
      varying vec3 vColor;
      uniform vec3 uColor;

      void main() {
        vec3 pos = position;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        float pulse = sin(uTime * 4.0 + aPhase);
        float scale = 1.0 + 0.4 * pulse;
        // multiply by uScale for appear animation
        gl_PointSize = aSize * scale * uScale * (18.0 / -mvPosition.z);
        
        vAlpha = (0.5 + 0.5 * pulse) * step(0.01, uScale); 
        
        vec3 white = vec3(1.0, 1.0, 1.0);
        vColor = mix(uColor, white, smoothstep(0.5, 1.0, pulse));
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vec2 uv = gl_PointCoord.xy - 0.5;
        if (length(uv) > 0.5) discard;
        gl_FragColor = vec4(vColor, vAlpha);
      }
    `
  }), []); 

  useEffect(() => {
    sparkleMaterial.uniforms.uColor.value.set(color);
  }, [color, sparkleMaterial]);

  const sparkleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 40;
    const positions = [];
    const sizes = [];
    const phases = [];
    for (let i = 0; i < count; i++) {
        const r = 0.2 + Math.random() * 0.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        positions.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi) * 0.6
        );
        sizes.push(2.0 + Math.random() * 2.0);
        phases.push(Math.random() * Math.PI * 2);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
    return geo;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // Sync growth
    const targetGrowth = visible ? 1.0 : 0.0;
    currentGrowth.current = THREE.MathUtils.lerp(currentGrowth.current, targetGrowth, 0.01);
    
    // Animate Show/Hide
    // Star appears when growth reaches near top (0.95)
    let targetScale = 0.0;
    if (currentGrowth.current > 0.95) {
        targetScale = THREE.MathUtils.smoothstep(currentGrowth.current, 0.95, 1.0);
    }
    
    scaleRef.current = targetScale; // Direct apply or smoothing? Using smoothstep above handles ramp.

    if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.5;
        groupRef.current.scale.setScalar(scaleRef.current);
    }

    sparkleMaterial.uniforms.uTime.value = time;
    sparkleMaterial.uniforms.uScale.value = scaleRef.current;
  });

  return (
    <group ref={groupRef} position={position} scale={[0,0,0]}>
        {/* Solid Star */}
        <mesh geometry={solidGeometry}>
            <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={8.0} 
                metalness={0.0} 
                roughness={0.2}
                transparent
            />
        </mesh>
        
        {/* Ambient Sparkles */}
        <points geometry={sparkleGeometry} material={sparkleMaterial} />
        
        {/* Light Source */}
        <pointLight 
            intensity={8 * scaleRef.current} 
            distance={8} 
            color={color} 
            decay={2} 
        />
    </group>
  );
};
