import React from 'react';

export interface TreeConfig {
  lightsOn: boolean;
  snowEnabled: boolean;
  musicEnabled: boolean;
  rotationSpeed: number;
  bgmUrl: string | null;
  photoUrls: string[];
  ribbonAnimationTrigger: number;
  isExperienceActive: boolean; // New Flag
  treeColor: string;
  ribbonColor: string;
  starColor: string;
  starDensity: number;
  skyColor: string;
  // Header Customization
  headerText: string;
  headerFont: string;
  headerColor: string;
}

export interface OverlayProps {
  config: TreeConfig;
  setConfig: React.Dispatch<React.SetStateAction<TreeConfig>>;
}

export interface TreeProps {
  lightsOn: boolean;
  photoUrls: string[];
  ribbonAnimationTrigger: number;
  isExperienceActive: boolean;
  treeColor: string;
  ribbonColor: string;
  starColor: string;
}

// Define the Three.js elements that are used in JSX
export interface ThreeElements {
  // Core
  group: any;
  mesh: any;
  points: any;
  primitive: any;
  color: any;
  
  // Lights
  ambientLight: any;
  pointLight: any;
  directionalLight: any;
  spotLight: any;
  hemisphereLight: any;
  
  // Geometries
  sphereGeometry: any;
  boxGeometry: any;
  planeGeometry: any;
  torusGeometry: any;
  bufferGeometry: any;
  coneGeometry: any;
  cylinderGeometry: any;
  
  // Materials
  meshBasicMaterial: any;
  meshStandardMaterial: any;
  meshPhysicalMaterial: any;
  shaderMaterial: any;
  pointsMaterial: any;

  // Additional elements just in case
  instancedMesh: any;
  line: any;
  lineLoop: any;
  lineSegments: any;
  texture: any;
  object3D: any;
  orthographicCamera: any;
  perspectiveCamera: any;
}

// Augment the global JSX namespace (legacy or specific setups)
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Augment React's JSX namespace (for React 18+ and newer TS configs)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}