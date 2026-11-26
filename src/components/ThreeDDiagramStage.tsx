import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Cpu, Eye, RotateCw, Sparkles, Layers, Sliders, Play, Pause } from 'lucide-react';
import type { VideoVisualMode } from '../data/videoLesson';

interface ThreeDDiagramStageProps {
  visualMode: VideoVisualMode;
  isPlaying: boolean;
  cueProgress: number;
}

export function ThreeDDiagramStage({
  visualMode,
  isPlaying,
  cueProgress,
}: ThreeDDiagramStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [activePreset, setActivePreset] = useState<'isometric' | 'orbit' | 'front'>('isometric');
  const [particleSpeed, setParticleSpeed] = useState<number>(1);
  const [glowIntensity, setGlowIntensity] = useState<number>(1.2);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);

  // Drag-to-rotate state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationMomentumRef = useRef({ x: 0.004, y: 0.012 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !groupRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    groupRef.current.rotation.y += deltaX * 0.012;
    groupRef.current.rotation.x += deltaY * 0.012;

    rotationMomentumRef.current = { x: deltaY * 0.0025, y: deltaX * 0.0025 };
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const setCameraPreset = useCallback((preset: 'isometric' | 'orbit' | 'front') => {
    setActivePreset(preset);
    const cam = cameraRef.current;
    if (!cam) return;
    if (preset === 'front') {
      cam.position.set(0, 0, 10);
      cam.lookAt(0, 0, 0);
    } else if (preset === 'orbit') {
      cam.position.set(0, 4.5, 9.5);
      cam.lookAt(0, 0, 0);
    } else {
      cam.position.set(6.5, 5.5, 7.5);
      cam.lookAt(0, 0, 0);
    }
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(6.5, 5.5, 7.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    keyLight.position.set(10, 14, 12);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x34d399, 1.4);
    fillLight.position.set(-10, -6, -8);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (groupRef.current) {
        if (isPlaying && !isDraggingRef.current) {
          groupRef.current.rotation.y += delta * 0.6 * particleSpeed;
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.0012 * particleSpeed) * 0.18;
        } else if (!isDraggingRef.current) {
          groupRef.current.rotation.y += rotationMomentumRef.current.y;
          groupRef.current.rotation.x += rotationMomentumRef.current.x;
          rotationMomentumRef.current.y *= 0.94;
          rotationMomentumRef.current.x *= 0.94;
        }
      }

      if (coreMeshRef.current) {
        coreMeshRef.current.scale.setScalar(
          1 + Math.sin(Date.now() * 0.003 * particleSpeed) * 0.06 * glowIntensity,
        );
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [isPlaying, particleSpeed, glowIntensity]);

  // Build high fidelity 3D models for each visual mode
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    coreMeshRef.current = null;

    const createMat = (color: number, emissive = 0x000000) => {
      return new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: emissive ? 0.45 * glowIntensity : 0,
        roughness: 0.2,
        metalness: 0.4,
        wireframe: wireframeMode,
      });
    };

    if (visualMode === 'variables' || visualMode === 'lists') {
      // 3D Storage Vault Clusters with glowing center crystal
      const boxGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
      const colors = [0x38bdf8, 0x34d399, 0xfbbf24, 0xa855f7];
      for (let i = 0; i < 4; i++) {
        const mesh = new THREE.Mesh(boxGeo, createMat(colors[i % colors.length]));
        mesh.position.set((i - 1.5) * 1.5, Math.sin(i * 1.5) * 0.35, 0);
        group.add(mesh);
      }

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 32, 32),
        createMat(0xfbbf24, 0xfbbf24),
      );
      core.position.set(0, 1.5, 0);
      group.add(core);
      coreMeshRef.current = core;
    } else if (visualMode === 'gates') {
      // 3D Silicon Logic Node with Floating Logic Bulb
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.35, 3.4),
        createMat(0x0f172a),
      );
      group.add(base);

      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.7, 32),
        createMat(0x38bdf8, 0x38bdf8),
      );
      core.position.set(0, 0.5, 0);
      group.add(core);
      coreMeshRef.current = core;

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 32, 32),
        createMat(0xfbbf24, 0xfbbf24),
      );
      bulb.position.set(0, 2.3, 0);
      group.add(bulb);
    } else if (visualMode === 'loops' || visualMode === 'operators') {
      // 3D Gyroscopic Rings & Orbiting Nodes
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(2.3, 0.2, 16, 64),
        createMat(0x34d399, 0x10b981),
      );
      ring1.rotation.x = Math.PI / 3;
      group.add(ring1);

      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, 0.18, 16, 64),
        createMat(0x38bdf8, 0x0ea5e9),
      );
      ring2.rotation.y = Math.PI / 4;
      group.add(ring2);

      const centerBall = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.7, 0),
        createMat(0xfbbf24, 0xfbbf24),
      );
      group.add(centerBall);
      coreMeshRef.current = centerBall;
    } else if (visualMode === 'ifelse') {
      // 3D Diamond Decision Matrix
      const diamond = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.9, 0),
        createMat(0x38bdf8, 0x0284c7),
      );
      group.add(diamond);
      coreMeshRef.current = diamond;

      const orbGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const orb1 = new THREE.Mesh(orbGeo, createMat(0x34d399, 0x34d399));
      orb1.position.set(2.8, 0, 0);
      group.add(orb1);

      const orb2 = new THREE.Mesh(orbGeo, createMat(0xfbbf24, 0xfbbf24));
      orb2.position.set(-2.8, 0, 0);
      group.add(orb2);
    } else if (visualMode === 'functions') {
      // 3D Interlocking Gear Assembly
      const gear1 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 0.5, 24),
        createMat(0x6366f1, 0x4f46e5),
      );
      gear1.rotation.x = Math.PI / 2;
      group.add(gear1);
      coreMeshRef.current = gear1;

      const gear2 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.1, 0.5, 18),
        createMat(0xa855f7, 0x9333ea),
      );
      gear2.position.set(2.4, 0, 0);
      gear2.rotation.x = Math.PI / 2;
      group.add(gear2);
    } else {
      const geo = new THREE.DodecahedronGeometry(1.8, 0);
      const mesh = new THREE.Mesh(geo, createMat(0x34d399, 0x059669));
      group.add(mesh);
      coreMeshRef.current = mesh;
    }
  }, [visualMode, wireframeMode, glowIntensity]);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative w-full h-full min-h-[230px] rounded-xl bg-gradient-to-br from-[#03060E] via-[#0A101E] to-[#050A16] border border-slate-700/80 overflow-hidden flex flex-col justify-between p-3 select-none shadow-inner"
    >
      {/* Top Simulation HUD Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono z-10 bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
        <span className="inline-flex items-center gap-1.5 text-sky-300 font-semibold">
          <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          3D Sim HUD
        </span>

        <div className="flex items-center gap-2">
          {/* Speed slider indicator */}
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <Sliders className="w-3 h-3 text-emerald-400" />
            <span>Speed:</span>
            <select
              value={particleSpeed}
              onChange={(e) => setParticleSpeed(Number(e.target.value))}
              aria-label="Simulation speed multiplier"
              className="bg-slate-900 border border-slate-700 text-emerald-300 rounded px-1 py-0.5 text-[10px] cursor-pointer focus:outline-none"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1.0x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>
          </div>

          {/* Wireframe toggle */}
          <button
            type="button"
            onClick={() => setWireframeMode((w) => !w)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
              wireframeMode
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold'
                : 'border-slate-700 bg-slate-900/90 text-slate-400 hover:text-white'
            }`}
          >
            {wireframeMode ? 'Wire: ON' : 'Solid'}
          </button>

          {/* Camera Presets */}
          <div className="inline-flex rounded-md border border-slate-700 bg-slate-900/90 p-0.5 gap-0.5">
            {(['isometric', 'orbit', 'front'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCameraPreset(preset)}
                className={`px-2 py-0.5 text-[10px] uppercase rounded cursor-pointer transition-colors ${
                  activePreset === preset
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset === 'isometric' ? 'Iso' : preset === 'orbit' ? 'Orbit' : 'Front'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Three.js Canvas Mount */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Live Simulation Telemetry HUD */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300 bg-slate-950/85 border border-slate-800/80 rounded-lg px-3 py-1.5 backdrop-blur-sm pointer-events-none shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-amber-300">Active: {visualMode}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sky-300">Prog: {Math.round(cueProgress * 100)}%</span>
          <span className="text-slate-400 hidden sm:inline">💡 Drag 3D Model to Rotate</span>
        </div>
      </div>
    </div>
  );
}
