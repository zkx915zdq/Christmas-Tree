
import React, { useState, useEffect } from 'react';
import { OverlayProps } from '../types';

export const Overlay: React.FC<OverlayProps> = ({ config, setConfig }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Countdown State
  const [countdownSetting, setCountdownSetting] = useState(0); // 0, 3, 5, 10
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const toggleLights = () => setConfig(prev => ({ ...prev, lightsOn: !prev.lightsOn }));
  const toggleSnow = () => setConfig(prev => ({ ...prev, snowEnabled: !prev.snowEnabled }));
  const toggleMusic = () => setConfig(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  const toggleRotation = () => setConfig(prev => ({ ...prev, rotationSpeed: prev.rotationSpeed > 0 ? 0 : 0.2 }));
  
  const startExperience = () => {
      setConfig(prev => ({ 
          ...prev, 
          isExperienceActive: true, 
          ribbonAnimationTrigger: prev.ribbonAnimationTrigger + 1 
      }));
  };

  const handleStartClick = () => {
      if (config.isExperienceActive) {
          // If active, just close it immediately
          setConfig(prev => ({ ...prev, isExperienceActive: false }));
          setIsVisible(true); // Show menu when closing
      } else {
          // If starting...
          setIsVisible(false); // Hide menu immediately
          if (countdownSetting > 0) {
              setTimeLeft(countdownSetting);
              setIsCountingDown(true);
          } else {
              startExperience();
          }
      }
  };

  // Countdown Logic (Internal only, no display)
  useEffect(() => {
      let timer: any;
      if (isCountingDown && timeLeft > 0) {
          timer = setTimeout(() => {
              setTimeLeft(prev => prev - 1);
          }, 1000);
      } else if (isCountingDown && timeLeft === 0) {
          // Countdown finished
          setIsCountingDown(false);
          startExperience();
      }
      return () => clearTimeout(timer);
  }, [isCountingDown, timeLeft]);


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

  const handleColorChange = (key: 'treeColor' | 'ribbonColor' | 'starColor' | 'skyColor' | 'headerColor', e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, [key]: e.target.value }));
  };

  const fonts = [
    { name: 'Mountains of Christmas', value: '"Mountains of Christmas", serif' },
    { name: 'Great Vibes', value: '"Great Vibes", cursive' },
    { name: 'Cinzel', value: '"Cinzel", serif' },
    { name: 'Henny Penny', value: '"Henny Penny", cursive' },
    { name: 'Playfair Display', value: '"Playfair Display", serif' },
  ];

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-hidden">
      {/* Header - Always Visible */}
      <header className="absolute top-8 w-full text-center pointer-events-auto z-40 transition-opacity duration-500 opacity-100">
        <input 
            type="text"
            value={config.headerText}
            onChange={(e) => setConfig(prev => ({ ...prev, headerText: e.target.value }))}
            className="text-4xl md:text-6xl text-center bg-transparent border-none outline-none w-full font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] cursor-text hover:opacity-80 transition-opacity"
            style={{ 
                fontFamily: config.headerFont, 
                color: config.headerColor,
                textShadow: `0 0 20px ${config.headerColor}66`
            }}
        />
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
          
          {/* Main Button for Experience */}
          <button 
            onClick={handleStartClick}
            disabled={isCountingDown}
            className={`w-full py-3 px-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all duration-300 border ${
                config.isExperienceActive 
                ? 'bg-transparent border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/20'
                : 'bg-[#d4af37] border-[#d4af37] text-[#031f18] hover:bg-[#b8952b] shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            } ${isCountingDown ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {config.isExperienceActive ? 'Close Experience' : (isCountingDown ? 'Starting...' : 'Start Experience')}
          </button>
          
          {/* Countdown Selector */}
          {!config.isExperienceActive && (
              <div className="flex items-center justify-between text-xs text-gray-300">
                  <span>Start Delay:</span>
                  <div className="flex gap-1 bg-black/30 rounded p-1">
                      {[0, 3, 5, 10].map(val => (
                          <button
                            key={val}
                            onClick={() => setCountdownSetting(val)}
                            className={`px-2 py-1 rounded transition-colors ${countdownSetting === val ? 'bg-[#d4af37] text-black font-bold' : 'hover:bg-white/10'}`}
                          >
                            {val}s
                          </button>
                      ))}
                  </div>
              </div>
          )}

          {/* Other Toggles - Only visible if active, or keep them visible? Keeping them visible allows pre-config */}
          <div className="grid grid-cols-2 gap-2 mt-2">
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

          {/* Header Customization */}
          <div className="flex justify-between items-center text-[#e2e8f0] mt-2">
             <span className="font-serif text-sm text-[#d4af37]">Title Style</span>
             <div className="h-px bg-[#d4af37]/30 flex-grow ml-4"></div>
          </div>
          
          <div className="flex flex-col gap-2">
             <select 
                value={config.headerFont} 
                onChange={(e) => setConfig(prev => ({ ...prev, headerFont: e.target.value }))}
                className="w-full bg-[#010b14] text-[#d4af37] text-xs p-2 rounded border border-gray-600 focus:border-[#d4af37] outline-none"
             >
                {fonts.map(font => (
                    <option key={font.name} value={font.value}>{font.name}</option>
                ))}
             </select>
             
             <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Title Color</span>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative w-8 h-6 rounded overflow-hidden border border-gray-500 group-hover:border-[#d4af37]">
                       <input type="color" value={config.headerColor} onChange={(e) => handleColorChange('headerColor', e)} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer" />
                    </div>
                </label>
             </div>
          </div>


          {/* Colors */}
          <div className="flex justify-between items-center text-[#e2e8f0] mt-2">
             <span className="font-serif text-sm text-[#d4af37]">Theme Colors</span>
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
