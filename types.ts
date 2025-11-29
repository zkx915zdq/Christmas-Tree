import React from 'react';

export interface TreeConfig {
  lightsOn: boolean;
  snowEnabled: boolean;
  musicEnabled: boolean;
  rotationSpeed: number;
  bgmUrl: string | null;
  photoUrls: string[];
  ribbonAnimationTrigger: number;
  treeColor: string;
  ribbonColor: string;
  starColor: string;
  starDensity: number;
  skyColor: string;
}

export interface OverlayProps {
  config: TreeConfig;
  setConfig: React.Dispatch<React.SetStateAction<TreeConfig>>;
}

export interface TreeProps {
  lightsOn: boolean;
  photoUrls: string[];
  ribbonAnimationTrigger: number;
  treeColor: string;
  ribbonColor: string;
  starColor: string;
}