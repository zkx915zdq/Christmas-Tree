
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
    isExperienceActive: false, // Default: Hidden
    treeColor: '#024025', // Deep Emerald
    ribbonColor: '#ffd700', // Dazzling Gold
    starColor: '#ffaa00', // Warm Gold
    starDensity: 3000,
    skyColor: '#000510', // Midnight Blue
    // Header Defaults
    headerText: "KaiXuan's Christmas Tree",
    headerFont: '"Mountains of Christmas", serif',
    headerColor: '#d4af37',
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
      
      {/* Music plays only when experience is active AND music is enabled */}
      <Music enabled={config.musicEnabled && config.isExperienceActive} src={config.bgmUrl} />

      <Loader 
        containerStyles={{ background: config.skyColor }}
        barStyles={{ background: config.headerColor }}
        dataStyles={{ color: config.headerColor, fontFamily: config.headerFont }}
      />
      
      <Overlay config={config} setConfig={setConfig} />
    </div>
  );
};

export default App;
