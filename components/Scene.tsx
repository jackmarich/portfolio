'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import RubiksCube from './RubiksCube';
import { useState } from 'react';
import { RefreshCcw, Shuffle, Github, Linkedin, Instagram, Youtube, Mail } from 'lucide-react';

export default function Scene() {
  const [isShuffling, setIsShuffling] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [triggerShuffle, setTriggerShuffle] = useState(0);
  const [triggerSolve, setTriggerSolve] = useState(0);

  const handleShuffle = () => {
    setTriggerShuffle(prev => prev + 1);
  };

  const handleSolve = () => {
    setTriggerSolve(prev => prev + 1);
  };

  const socialLinks = [
    { icon: <Mail size={18} />, href: 'mailto:jackmarich1@gmail.com', label: 'Email' },
    { icon: <Linkedin size={18} />, href: 'https://www.linkedin.com/in/jackmarich/', label: 'LinkedIn' },
    { icon: <Github size={18} />, href: 'https://github.com/jackmarich', label: 'GitHub' },
    { icon: <Instagram size={18} />, href: 'https://www.instagram.com/jackmarich/', label: 'Instagram' },
    { icon: <Youtube size={18} />, href: 'https://www.youtube.com/@jackmarich', label: 'YouTube' },
  ];

  return (
    <>
      <div className="absolute inset-0 animate-fall-main">
        <Canvas camera={{ position: [10, 10, 10], fov: 45 }} shadows>
          <color attach="background" args={['#f5f5f5']} />
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <spotLight 
            position={[10, 10, 10]} 
            angle={0.15} 
            penumbra={1} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
          
          {/* Post Processing */}
          <EffectComposer>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={0.5} radius={0.4} />
          </EffectComposer>

          <RubiksCube 
            triggerShuffle={triggerShuffle} 
            triggerSolve={triggerSolve}
            onShuffleStart={() => setIsShuffling(true)}
            onShuffleEnd={() => setIsShuffling(false)}
            onSolveStart={() => setIsSolving(true)}
            onSolveEnd={() => setIsSolving(false)}
          />

          <Environment preset="studio" />
          <OrbitControls 
            makeDefault 
            enablePan={false} 
            minDistance={4} 
            maxDistance={15} 
            dampingFactor={0.05} 
            autoRotate
            autoRotateSpeed={1.5}
          />
        </Canvas>
      </div>

      <div className="absolute bottom-10 left-1/2 flex flex-col items-center gap-4 pointer-events-auto animate-drop-controls" style={{ transform: 'translateX(-50%)' }}>
        <div className="flex gap-4">
          <button
            onClick={handleShuffle}
            disabled={isShuffling || isSolving}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg backdrop-blur-md bg-opacity-80"
          >
            <Shuffle size={20} />
            Shuffle
          </button>
          <button
            onClick={handleSolve}
            disabled={isShuffling || isSolving}
            className="flex items-center gap-2 px-6 py-3 bg-white/80 text-black border border-white/20 rounded-full hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg backdrop-blur-md"
          >
            <RefreshCcw size={20} />
            Solve
          </button>
        </div>
        <p className="text-gray-400 text-sm font-mono uppercase tracking-widest opacity-60">Drag to Rotate • Scroll to Zoom</p>
      </div>

      <div className="absolute top-10 left-10 text-black animate-slide-title w-max">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">JACK MARICH</h1>
        <p className="text-gray-500 font-mono text-sm mb-4">MAKER • ENGINEER • INVENTOR</p>
        
        <div className="flex gap-3 animate-fade-socials">
          {socialLinks.map((link, i) => (
            <a
              key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 border border-black/10 hover:bg-black/5 hover:scale-110 transition-all backdrop-blur-sm text-gray-700 hover:text-black"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

