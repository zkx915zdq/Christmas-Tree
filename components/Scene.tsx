
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Group } from 'three';
import { ChristmasTree } from './ChristmasTree';
import { MagicParticles } from './MagicParticles';
import { Gifts } from './Gifts';
import { TreeConfig } from '../types';

interface SceneProps {
  config: TreeConfig;
}

export const Scene: React.FC<SceneProps> = ({ config }) => {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current && config.rotationSpeed > 0) {
      groupRef.current.rotation.y += delta * config.rotationSpeed;
    }
  });

  return (
    <>
      {/* Space Background Color */}
      <color attach="background" args={[config.skyColor]} />

      <PerspectiveCamera makeDefault position={[0, 2, 16]} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 6} 
        maxPolarAngle={Math.PI / 1.5}
        minDistance={5}
        maxDistance={30}
        dampingFactor={0.05}
        target={[0, 5, 0]} 
      />

      {/* --- LIGHTING --- */}
      {/* Reflection Environment */}
      <Environment preset="city" background={false} />

      {/* Ambient starlight */}
      <ambientLight intensity={0.2} color="#ffffff" />
      
      {/* Key light for tree definition */}
      <directionalLight 
        position={[-10, 10, 20]} 
        intensity={1.0} 
        color="#ffffff" 
        castShadow 
      />
      
      {/* Warm Tree Glow */}
      <pointLight position={[0, 6, 0]} intensity={0.8} color="#ffaa00" distance={25} />

      {/* Interactive Background Stars */}
      <Stars 
        radius={150} 
        depth={60} 
        count={config.starDensity} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5} 
      />

      <group ref={groupRef} position={[0, -3, 0]}>
        <ChristmasTree 
            lightsOn={config.lightsOn} 
            photoUrls={config.photoUrls} 
            ribbonAnimationTrigger={config.ribbonAnimationTrigger}
            treeColor={config.treeColor}
            ribbonColor={config.ribbonColor}
            starColor={config.starColor}
        />
        {config.lightsOn && <MagicParticles />}
        <Gifts />
      </group>

      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={1.1} // Only very bright things glow
          mipmapBlur 
          intensity={0.6} 
          radius={0.5} 
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
        <Noise opacity={0.03} />
      </EffectComposer>
    </>
  );
};
