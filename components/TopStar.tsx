
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface TopStarProps {
  position: [number, number, number];
  color?: string;
}

export const TopStar: React.FC<TopStarProps> = ({ position, color = '#ffaa00' }) => {
  const groupRef = useRef<THREE.Group>(null);
  
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

        // Front Face (Connect Front Peak to Ring)
        indices.push(0, currentRingIndex, nextRingIndex);
        // Back Face (Connect Back Peak to Ring)
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
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
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
        gl_PointSize = aSize * scale * (18.0 / -mvPosition.z);
        
        vAlpha = (0.5 + 0.5 * pulse); 
        
        vec3 white = vec3(1.0, 1.0, 1.0);
        // Mix user color with white for sparkle
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
  }), []); // Removed color dependency

  useEffect(() => {
    sparkleMaterial.uniforms.uColor.value.set(color);
  }, [color, sparkleMaterial]);

  // Geometry for ambient sparkles
  const sparkleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 40;
    const positions = [];
    const sizes = [];
    const phases = [];
    for (let i = 0; i < count; i++) {
        // Tighter radius for smaller star
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
    
    if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.5;
    }

    sparkleMaterial.uniforms.uTime.value = time;
  });

  return (
    <group ref={groupRef} position={position}>
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
        
        {/* Light Source (Very bright to glow) */}
        <pointLight 
            intensity={8} 
            distance={8} 
            color={color} 
            decay={2} 
        />
    </group>
  );
};
