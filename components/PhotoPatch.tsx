
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
  isVisible: boolean; // Corresponds to isExperienceActive
  revealDelay?: number; // Normalized height (0..1)
  onClick: () => void;
}

export const PhotoPatch: React.FC<PhotoPatchProps> = ({ 
  url, position, rotation, size, opacity, isActive, isVisible, revealDelay = 0, onClick 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [aspect, setAspect] = useState(1);
  
  // Local growth state to sync with tree animation
  const currentGrowth = useRef(0);
  
  const { camera } = useThree();
  
  const { initialRadius, initialAngle, initialY } = useMemo(() => {
    const r = Math.sqrt(position[0] * position[0] + position[2] * position[2]);
    const theta = Math.atan2(position[2], position[0]);
    return { initialRadius: r, initialAngle: theta, initialY: position[1] };
  }, [position]);

  const floatParams = useMemo(() => ({
    orbitSpeed: (Math.random() * 0.05 + 0.02) * (Math.random() > 0.5 ? 1 : -1),
    bobSpeed: Math.random() * 1.0 + 0.5,
    bobAmp: Math.random() * 0.2 + 0.1,
    swayPhase: Math.random() * 10
  }), []);

  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(url);
    tex.anisotropy = 16; 
    return tex;
  }, [url]);

  useEffect(() => {
    if (texture.image) {
      setAspect(texture.image.width / texture.image.height);
    }
  }, [texture, texture.image]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: texture },
      uOpacity: { value: 1.0 }, // Always 1, visibility controlled by scale
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
        
        float borderWidth = 0.03;
        float borderX = step(1.0 - borderWidth, vUv.x) + step(vUv.x, borderWidth);
        float borderY = step(1.0 - borderWidth, vUv.y) + step(vUv.y, borderWidth);
        float isBorder = max(borderX, borderY);
        
        vec3 finalColor = mix(texColor.rgb, uBorderColor, isBorder);
        
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
    
    // Sync growth
    const target = isVisible ? 1.0 : 0.0;
    currentGrowth.current = THREE.MathUtils.lerp(currentGrowth.current, target, 0.01);
    
    if (meshRef.current) {
      material.uniforms.uTime.value = time;
      
      const baseScaleX = size[1] * aspect; 
      const baseScaleY = size[1];
      
      let interactionScale = 1.0;
      if (isActive) {
          interactionScale = 4.0;
      } else if (hovered) {
          interactionScale = 1.5;
      }
      
      // Reveal Logic based on height (revealDelay)
      let revealScale = 0.0;
      if (currentGrowth.current > revealDelay) {
         // Pop in smoothly over a short range (e.g. 0.1 height units)
         revealScale = THREE.MathUtils.smoothstep(currentGrowth.current, revealDelay, revealDelay + 0.1);
      }

      const finalScale = interactionScale * revealScale;

      // Apply Scale
      meshRef.current.scale.lerp(new THREE.Vector3(baseScaleX * finalScale, baseScaleY * finalScale, 1.0), 0.1);
      meshRef.current.visible = revealScale > 0.01;
      
      meshRef.current.renderOrder = isActive ? 9999 : (hovered ? 10 : 1);
      
      if (isActive) {
          material.depthTest = false;
      } else {
          material.depthTest = true;
      }
    }

    if (groupRef.current) {
        let targetLocalPos = new THREE.Vector3();
        
        if (isActive) {
            const targetWorldPos = new THREE.Vector3();
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            targetWorldPos.copy(camera.position).add(camDir.multiplyScalar(8));
            
            if (groupRef.current.parent) {
                const parentInverse = groupRef.current.parent.matrixWorld.clone().invert();
                targetLocalPos.copy(targetWorldPos).applyMatrix4(parentInverse);
            } else {
                targetLocalPos.copy(targetWorldPos);
            }
            groupRef.current.position.lerp(targetLocalPos, 0.1);
            groupRef.current.lookAt(camera.position);
        } else {
            const currentAngle = initialAngle + time * floatParams.orbitSpeed;
            const currentRadius = initialRadius;
            let currentY = initialY;
            currentY += Math.sin(time * floatParams.bobSpeed + floatParams.swayPhase) * floatParams.bobAmp;

            const x = currentRadius * Math.cos(currentAngle);
            const z = currentRadius * Math.sin(currentAngle);
            targetLocalPos.set(x, currentY, z);
            groupRef.current.position.lerp(targetLocalPos, 0.05);

            const faceOutAngle = -currentAngle - Math.PI / 2;
            const swayX = Math.sin(time * 0.5 + floatParams.swayPhase) * 0.1;
            const swayZ = Math.cos(time * 0.3 + floatParams.swayPhase) * 0.1;
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
            // Only click if visible
            if (currentGrowth.current > revealDelay) onClick();
        }}
        onPointerOver={(e) => { 
            e.stopPropagation(); 
            if (currentGrowth.current > revealDelay) { setHovered(true); document.body.style.cursor = 'pointer'; }
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
