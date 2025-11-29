
import React, { useState } from 'react';
import { OverlayProps } from '../types';

export const Overlay: React.FC<OverlayProps> = ({ config, setConfig }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  const toggleLights = () => setConfig(prev => ({ ...prev, lightsOn: !prev.lightsOn }));
  const toggleSnow = () => setConfig(prev => ({ ...prev, snowEnabled: !prev.snowEnabled }));
  const toggleMusic = () => setConfig(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  const toggleRotation = () => setConfig(prev => ({ ...prev, rotationSpeed: prev.rotationSpeed > 0 ? 0 : 0.2 }));
  
  const animateRibbon = () => setConfig(prev => ({ ...prev, ribbonAnimationTrigger: prev.ribbonAnimationTrigger + 1 }));

  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file as Blob);
      setConfig(prev => ({ ...prev, bgmUrl: url, musicEnabled: true }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const urls = Array.from(files).map(file => URL.createObjectURL(file as Blob));
      setConfig(prev => ({ ...prev, photoUrls: [...prev.photoUrls, ...urls] }));
    }
  };

  const handleColorChange = (key: 'treeColor' | 'ribbonColor' | 'starColor' | 'skyColor', e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-hidden">
      {/* Header */}
      <header className={`absolute top-8 w-full text-center transition-opacity duration-500 ${isVisible ? 'opacity-90' : 'opacity-0'}`}>
        <h1 className="text-4xl md:text-6xl font-serif text-[#d4af37] tracking-wider drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)] font-bold" style={{ fontFamily: '"Mountains of Christmas", serif' }}>
          KaiXuan's Christmas Tree
        </h1>
      </header>

      {/* Toggle Visibility Button - Left Side */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-auto z-50">
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="bg-[#031f18]/80 backdrop-blur-md border border-[#d4af37]/50 text-[#d4af37] rounded-full p-2 hover:bg-[#d4af37] hover:text-[#031f18] transition-all shadow-lg"
          title={isVisible ? "Hide Controls" : "Show Controls"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-500 ${isVisible ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Control Panel Container - Left Side */}
      <div className={`absolute left-16 top-1/2 transform -translate-y-1/2 w-80 pointer-events-auto transition-all duration-500 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'}`}>
        <div className="bg-[#031f18]/80 backdrop-blur-md border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 hover:border-[#d4af37]/60 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          <div className="flex justify-between items-center text-[#e2e8f0]">
            <span className="font-serif text-lg text-[#d4af37]">Controls</span>
            <div className="h-px bg-[#d4af37]/30 flex-grow ml-4"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={toggleLights}
              className={`py-3 px-1 rounded-lg text-xs font-medium transition-all duration-300 border ${
                config.lightsOn 
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              {config.lightsOn ? 'Lights' : 'Off'}
            </button>
            
            <button 
              onClick={toggleSnow}
              className={`py-3 px-1 rounded-lg text-xs font-medium transition-all duration-300 border ${
                config.snowEnabled 
                ? 'bg-[#a7d1c6]/20 border-[#a7d1c6] text-[#a7d1c6] shadow-[0_0_15px_rgba(167,209,198,0.2)]' 
                : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              {config.snowEnabled ? 'Snow' : 'No Snow'}
            </button>

            <button 
              onClick={toggleMusic}
              className={`py-3 px-1 rounded-lg text-xs font-medium transition-all duration-300 border ${
                config.musicEnabled
                ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              {config.musicEnabled ? 'Music On' : 'Music Off'}
            </button>

            <button 
              onClick={toggleRotation}
              className={`py-3 px-1 rounded-lg text-xs font-medium transition-all duration-300 border ${
                config.rotationSpeed > 0
                ? 'bg-[#0d9488]/20 border-[#0d9488] text-[#0d9488] shadow-[0_0_15px_rgba(13,148,136,0.2)]' 
                : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              {config.rotationSpeed > 0 ? 'Spin' : 'Static'}
            </button>
          </div>
          
          {/* Animation Trigger */}
          <button 
            onClick={animateRibbon}
            className="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 border bg-[#d4af37] text-[#031f18] hover:bg-[#b8952b] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          >
            Stream Ribbon
          </button>

          <div className="flex justify-between items-center text-[#e2e8f0] mt-2">
             <span className="font-serif text-sm text-[#d4af37]">Colors</span>
             <div className="h-px bg-[#d4af37]/30 flex-grow ml-4"></div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
             <label className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="relative w-full h-8 rounded-lg overflow-hidden border border-gray-500 group-hover:border-[#d4af37] transition-colors">
                   <input type="color" value={config.treeColor} onChange={(e) => handleColorChange('treeColor', e)} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 m-0" />
                </div>
                <span className="text-[10px] uppercase text-gray-400 tracking-wider group-hover:text-[#d4af37] transition-colors">Tree</span>
             </label>
             <label className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="relative w-full h-8 rounded-lg overflow-hidden border border-gray-500 group-hover:border-[#d4af37] transition-colors">
                   <input type="color" value={config.ribbonColor} onChange={(e) => handleColorChange('ribbonColor', e)} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 m-0" />
                </div>
                <span className="text-[10px] uppercase text-gray-400 tracking-wider group-hover:text-[#d4af37] transition-colors">Ribbon</span>
             </label>
             <label className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="relative w-full h-8 rounded-lg overflow-hidden border border-gray-500 group-hover:border-[#d4af37] transition-colors">
                   <input type="color" value={config.starColor} onChange={(e) => handleColorChange('starColor', e)} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 m-0" />
                </div>
                <span className="text-[10px] uppercase text-gray-400 tracking-wider group-hover:text-[#d4af37] transition-colors">Star</span>
             </label>
             <label className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="relative w-full h-8 rounded-lg overflow-hidden border border-gray-500 group-hover:border-[#d4af37] transition-colors">
                   <input type="color" value={config.skyColor} onChange={(e) => handleColorChange('skyColor', e)} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 m-0" />
                </div>
                <span className="text-[10px] uppercase text-gray-400 tracking-wider group-hover:text-[#d4af37] transition-colors">Sky</span>
             </label>
          </div>

          <div className="flex justify-between items-center text-[#e2e8f0] mt-2">
             <span className="font-serif text-sm text-[#d4af37]">Atmosphere</span>
             <div className="h-px bg-[#d4af37]/30 flex-grow ml-4"></div>
          </div>
          
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Star Density</span>
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="100" 
                  value={config.starDensity} 
                  onChange={(e) => setConfig(prev => ({ ...prev, starDensity: parseInt(e.target.value) }))}
                  className="w-1/2 accent-[#d4af37] h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
             </div>
          </div>

          <div className="flex justify-between items-center text-[#e2e8f0] mt-2">
             <span className="font-serif text-sm text-[#d4af37]">Uploads</span>
             <div className="h-px bg-[#d4af37]/30 flex-grow ml-4"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="relative group">
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleBgmUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="py-2 px-3 rounded-lg border border-dashed border-gray-500 text-gray-400 text-xs text-center group-hover:border-[#d4af37] group-hover:text-[#d4af37] transition-colors">
                  Upload BGM ♫
                </div>
             </div>
             <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="py-2 px-3 rounded-lg border border-dashed border-gray-500 text-gray-400 text-xs text-center group-hover:border-[#d4af37] group-hover:text-[#d4af37] transition-colors">
                  Add Photos 📷
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Footer / Signature */}
      <div className={`absolute bottom-4 right-6 text-[#4b5563] text-xs font-light transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        React 3D • Joyeux Noël
      </div>
    </div>
  );
};
