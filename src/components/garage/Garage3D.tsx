"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Component, Suspense, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { PartId } from "@/lib/types";
import type { Model3D } from "@/lib/data/models3d";
import { CarModel3D, PART_ANCHORS, type CarModel3DProps } from "./CarModel3D";
import { RealCar3D } from "./RealCar3D";
import { GarageLights, GarageRoom } from "./GarageRoom";
import { ResponsiveFov } from "./ResponsiveFov";

/** If a GLB fails to load (404, bad file, no WebGL extension) fall back to the schematic car */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode; onError?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Smoothly glide the orbit target toward the selected part */
function FocusRig({ selected, controls }: { selected: PartId | null; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const goal = useRef(new THREE.Vector3(0, 0.6, 0));
  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    const a = selected ? PART_ANCHORS[selected] : null;
    goal.current.set(a ? a[0] * 0.5 : 0, a ? Math.min(1, a[1]) * 0.8 : 0.6, a ? a[2] * 0.5 : 0);
    c.target.lerp(goal.current, 0.06);
  });
  return null;
}

/** Light turntable under the car */
function Turntable() {
  return (
    <group>
      <mesh position={[0, 0.012, 0]} receiveShadow raycast={() => null}>
        <cylinderGeometry args={[3.1, 3.1, 0.024, 96]} />
        <meshStandardMaterial color="#dfe2e6" metalness={0.3} roughness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]} raycast={() => null}>
        <ringGeometry args={[3.02, 3.1, 128]} />
        <meshBasicMaterial color="#f3a712" toneMapped={false} />
      </mesh>
    </group>
  );
}

export interface Garage3DProps extends CarModel3DProps {
  autoRotate: boolean;
  onInteract: () => void;
  /** Real GLB model; null renders the schematic car */
  model: Model3D | null;
  onModelError?: () => void;
}

export default function Garage3D({ autoRotate, onInteract, model, onModelError, ...car }: Garage3DProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [6.6, 2.6, 6.4], fov: 40 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      onPointerMissed={() => car.onSelect(null)}
    >
      <color attach="background" args={["#eef0f2"]} />
      <GarageLights />

      <Suspense fallback={null}>
        {model ? (
          <ModelBoundary key={model.url} fallback={<CarModel3D {...car} />} onError={onModelError}>
            <Suspense fallback={<CarModel3D {...car} xray />}>
              <RealCar3D {...car} model={model} />
            </Suspense>
          </ModelBoundary>
        ) : (
          <CarModel3D {...car} />
        )}
        <GarageRoom bays={1} back={-9.5} front={9.5} margin={6.5} height={6.2} />
        <Turntable />
        <ContactShadows position={[0, 0.03, 0]} opacity={0.55} scale={10} blur={2.2} far={1.5} resolution={512} />
      </Suspense>

      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={5}
        maxDistance={8.2}
        minPolarAngle={0.9}
        maxPolarAngle={Math.PI / 2.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
        enableDamping
        onStart={onInteract}
      />
      <FocusRig selected={car.selected} controls={controls} />
      <ResponsiveFov landscape={40} portrait={60} />
    </Canvas>
  );
}
