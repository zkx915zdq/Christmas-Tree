import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface PhotoPatchProps {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  opacity: number;
  isActive: boolean;
  onClick: () => void;
}

export const PhotoPatch: React.FC<PhotoPatchProps> = ({ 
  url, position, rotation, size, opacity, isActive, onClick 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [aspect, setAspect] = useState(1);
  
  const { camera } = useThree();
  
  // Calculate orbital parameters based on the initial position provided by the tree generator
  const { initialRadius, initialAngle, initialY } = useMemo(() => {
    const r = Math.sqrt(position[0] * position[0] + position[2] * position[2]);
    const theta = Math.atan2(position[2], position[0]);
    return { initialRadius: r, initialAngle: theta, initialY: position[1] };
  }, [position]);

  // Randomize floating animation parameters for organic feel
  const floatParams = useMemo(() => ({
    orbitSpeed: (Math.random() * 0.05 + 0.02) * (Math.random() > 0.5 ? 1 : -1), // Slow rotation around tree
    bobSpeed: Math.random() * 1.0 + 0.5,
    bobAmp: Math.random() * 0.2 + 0.1,
    swayPhase: Math.random() * 10
  }), []);

  // Load texture
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(url);
    tex.anisotropy = 16; 
    return tex;
  }, [url]);

  // Update aspect ratio when texture loads
  useEffect(() => {
    if (texture.image) {
      setAspect(texture.image.width / texture.image.height);
    }
  }, [texture, texture.image]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: texture },
      uOpacity: { value: 0 }, 
      uBorderColor: { value: new THREE.Color('#d4af37') } 
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true, 
    blending: THREE.NormalBlending, 
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uOpacity;
      uniform vec3 uBorderColor;
      varying vec2 vUv;
      
      void main() {
        vec4 texColor = texture2D(uTexture, vUv);
        
        // Elegant Gold Frame
        float borderWidth = 0.03;
        float borderX = step(1.0 - borderWidth, vUv.x) + step(vUv.x, borderWidth);
        float borderY = step(1.0 - borderWidth, vUv.y) + step(vUv.y, borderWidth);
        float isBorder = max(borderX, borderY);
        
        vec3 finalColor = mix(texColor.rgb, uBorderColor, isBorder);
        
        // Add subtle sheen to the border
        if (isBorder > 0.5) {
            float sheen = dot(normalize(vec3(1.0, 1.0, 1.0)), normalize(vec3(vUv.x, vUv.y, 1.0)));
            finalColor += vec3(0.2) * sheen;
        }

        gl_FragColor = vec4(finalColor, texColor.a * uOpacity);
      }
    `
  }), [texture]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (meshRef.current) {
      material.uniforms.uTime.value = time;
      
      // Smooth fade in
      material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
         material.uniforms.uOpacity.value, 
         opacity, 
         0.05
      );

      // --- SCALE ANIMATION ---
      const baseScaleX = size[1] * aspect; 
      const baseScaleY = size[1];
      
      let targetScale = 1.0;
      
      if (isActive) {
          targetScale = 4.0; // Enlarge significantly when active
      } else if (hovered) {
          targetScale = 1.5; // Mild zoom on hover
      }

      meshRef.current.scale.lerp(new THREE.Vector3(baseScaleX * targetScale, baseScaleY * targetScale, 1.0), 0.1);
      
      // Ensure active photo renders on top
      meshRef.current.renderOrder = isActive ? 9999 : (hovered ? 10 : 1);
      
      // Fix Z-fighting or transparency depth issues when active
      if (isActive) {
          material.depthTest = false;
      } else {
          material.depthTest = true;
      }
    }

    if (groupRef.current) {
        let targetLocalPos = new THREE.Vector3();
        
        if (isActive) {
            // 1. Calculate the target position in WORLD Space (fixed in front of camera)
            const targetWorldPos = new THREE.Vector3();
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            
            // Position 8 units directly in front of camera center
            targetWorldPos.copy(camera.position).add(camDir.multiplyScalar(8));
            
            // 2. Convert World Position to LOCAL Position
            // This is crucial because the parent group (Tree) is rotating.
            // We need to calculate where "Center Screen" is relative to the Tree's current rotation.
            if (groupRef.current.parent) {
                // Get the inverse of the parent's world matrix
                const parentInverse = groupRef.current.parent.matrixWorld.clone().invert();
                // Apply it to the world target to get the local target
                targetLocalPos.copy(targetWorldPos).applyMatrix4(parentInverse);
            } else {
                targetLocalPos.copy(targetWorldPos);
            }
            
            // 3. Lerp to the calculated local position
            groupRef.current.position.lerp(targetLocalPos, 0.1);
            
            // 4. Look at camera (World Space lookAt works fine even nested)
            groupRef.current.lookAt(camera.position);

        } else {
            // NORMAL ORBIT LOGIC
            const currentAngle = initialAngle + time * floatParams.orbitSpeed;
            const currentRadius = initialRadius;
            let currentY = initialY;
            currentY += Math.sin(time * floatParams.bobSpeed + floatParams.swayPhase) * floatParams.bobAmp;

            const x = currentRadius * Math.cos(currentAngle);
            const z = currentRadius * Math.sin(currentAngle);
            targetLocalPos.set(x, currentY, z);
            
            groupRef.current.position.lerp(targetLocalPos, 0.05);

            // Face roughly outwards + subtle swaying
            const faceOutAngle = -currentAngle - Math.PI / 2;
            const swayX = Math.sin(time * 0.5 + floatParams.swayPhase) * 0.1;
            const swayZ = Math.cos(time * 0.3 + floatParams.swayPhase) * 0.1;

            // Smooth rotation back to orbit state
            // We construct a quaternion for the orbit rotation
            const targetEuler = new THREE.Euler(swayX, faceOutAngle, swayZ);
            const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
            groupRef.current.quaternion.slerp(targetQuat, 0.05);
        }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation[1], 0]}>
        <mesh 
        ref={meshRef} 
        material={material}
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        onPointerOver={(e) => { 
            e.stopPropagation(); 
            setHovered(true); 
            document.body.style.cursor = 'pointer'; 
        }}
        onPointerOut={(e) => { 
            setHovered(false); 
            document.body.style.cursor = 'auto'; 
        }}
        >
        <planeGeometry args={[1, 1]} />
        </mesh>
    </group>
  );
};