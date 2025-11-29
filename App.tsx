import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { Music } from './components/Music';
import { TreeConfig } from './types';

const App: React.FC = () => {
  const [config, setConfig] = useState<TreeConfig>({
    lightsOn: true,
    snowEnabled: true,
    musicEnabled: false,
    rotationSpeed: 0.2,
    bgmUrl: null,
    photoUrls: [],
    ribbonAnimationTrigger: 0,
    treeColor: '#024025', // Deep Emerald
    ribbonColor: '#ffd700', // Dazzling Gold
    starColor: '#ffaa00', // Warm Gold
    starDensity: 3000,
    skyColor: '#000510', // Midnight Blue
  });

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: config.skyColor }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 14], fov: 45 }}
        gl={{ antialias: false, stencil: false, depth: true }}
      >
        <Suspense fallback={null}>
          <Scene config={config} />
        </Suspense>
      </Canvas>
      
      <Music enabled={config.musicEnabled} src={config.bgmUrl} />

      <Loader 
        containerStyles={{ background: config.skyColor }}
        barStyles={{ background: '#d4af37' }}
        dataStyles={{ color: '#d4af37', fontFamily: 'Playfair Display' }}
      />
      
      <Overlay config={config} setConfig={setConfig} />
    </div>
  );
};

export default App;