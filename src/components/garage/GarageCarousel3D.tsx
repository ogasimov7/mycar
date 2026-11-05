"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, Suspense, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Model3D } from "@/lib/data/models3d";
import { CarModel3D } from "./CarModel3D";
import { BAY, GarageLights, GarageRoom } from "./GarageRoom";
import { RealCar3D } from "./RealCar3D";
import { ResponsiveFov } from "./ResponsiveFov";

export interface CarouselCar {
  id: string;
  color: string;
  body: "sedan" | "suv" | "hatch" | "van";
  model: Model3D | null;
}

const noop = () => {};

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Glides the camera to the selected bay */
function CameraRig({ index }: { index: number }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.7, 0));
  const goalPos = useRef(new THREE.Vector3());
  const goalTarget = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const x = index * BAY;
    goalPos.current.set(x + 4.6, 2.1, 6.2);
    goalTarget.current.set(x, 0.75, 0);
    const k = 1 - Math.exp(-dt * 4);
    camera.position.lerp(goalPos.current, k);
    target.current.lerp(goalTarget.current, k);
    camera.lookAt(target.current);
  });
  return null;
}

/** Slowly spins the car that is in focus, eases the others back to a parked angle */
function Spinner({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (active) g.rotation.y += dt * 0.35;
    else g.rotation.y += (-0.45 - g.rotation.y) * (1 - Math.exp(-dt * 3));
  });
  return (
    <group ref={ref} rotation={[0, -0.45, 0]}>
      {children}
    </group>
  );
}

function Car({ car, active }: { car: CarouselCar; active: boolean }) {
  const props = {
    color: car.color,
    body: car.body,
    xray: false,
    selected: null,
    hovered: null,
    setHovered: noop,
    onSelect: noop,
    marked: [],
  };
  return (
    <Spinner active={active}>
      {car.model ? (
        <Boundary fallback={<CarModel3D {...props} />}>
          <Suspense fallback={<CarModel3D {...props} xray />}>
            <RealCar3D {...props} model={car.model} />
          </Suspense>
        </Boundary>
      ) : (
        <CarModel3D {...props} />
      )}
    </Spinner>
  );
}

/** Empty bay marker: a faint glowing outline where a new car can park */
function EmptyBay() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current?.material as THREE.MeshBasicMaterial | undefined;
    if (m) m.opacity = 0.35 + Math.sin(clock.elapsedTime * 2) * 0.15;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.2]} raycast={() => null}>
      <ringGeometry args={[1.6, 1.75, 64]} />
      <meshBasicMaterial color="#f3a712" transparent opacity={0.4} toneMapped={false} />
    </mesh>
  );
}

export default function GarageCarousel3D({ cars, index }: { cars: CarouselCar[]; index: number }) {
  const bays = cars.length + 1; // last bay stays empty for "add car"
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [4.6, 2.1, 6.2], fov: 42 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
    >
      <color attach="background" args={["#eef0f2"]} />
      <GarageLights />
      <Suspense fallback={null}>
        <GarageRoom bays={bays} />
        {cars.map((car, i) =>
          // only mount the focused car and its neighbours — keeps mobile GPUs happy
          Math.abs(i - index) <= 1 ? (
            <group key={car.id} position={[i * BAY, 0, 0.3]}>
              <Car car={car} active={i === index} />
            </group>
          ) : null,
        )}
        <group position={[cars.length * BAY, 0, 0]}>
          <EmptyBay />
        </group>
        {cars.map((car, i) =>
          Math.abs(i - index) <= 1 ? (
            <ContactShadows key={car.id} position={[i * BAY, 0.02, 0.3]} opacity={0.5} scale={9} blur={2.2} far={1.4} resolution={256} />
          ) : null,
        )}
      </Suspense>
      <CameraRig index={index} />
      <ResponsiveFov landscape={42} portrait={62} />
    </Canvas>
  );
}
