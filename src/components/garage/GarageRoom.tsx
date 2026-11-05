"use client";

import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { useMemo } from "react";

/** Distance between parking bays (car is ~4.5 m long, ~2 m wide) */
export const BAY = 6.5;

const C = {
  floor: "#a9afb6",
  wall: "#e6e9ec",
  band: "#959ca5",
  ceiling: "#f6f7f8",
  door: "#c4c9cf",
  line: "#ffffff",
  yellow: "#f2b705",
  cabinet: "#f3a712",
  steel: "#8c939b",
  wood: "#b08a5a",
  rubber: "#1a1b1d",
};

function Box({ p, s, c, m = 0, r = 0.7, e }: { p: [number, number, number]; s: [number, number, number]; c: string; m?: number; r?: number; e?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow raycast={() => null}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} metalness={m} roughness={r} emissive={e ? c : "#000"} emissiveIntensity={e ?? 0} toneMapped={!e} />
    </mesh>
  );
}

/** Ribbed roller shutter door */
function RollerDoor({ x, back }: { x: number; back: number }) {
  const slats = 14;
  const w = 4.2;
  const h = 3.2;
  return (
    <group position={[x, 0, back + 0.06]}>
      {/* frame */}
      <Box p={[-w / 2 - 0.08, h / 2, 0]} s={[0.16, h + 0.1, 0.12]} c={C.steel} m={0.6} r={0.4} />
      <Box p={[w / 2 + 0.08, h / 2, 0]} s={[0.16, h + 0.1, 0.12]} c={C.steel} m={0.6} r={0.4} />
      <Box p={[0, h + 0.18, 0.02]} s={[w + 0.5, 0.36, 0.3]} c={C.steel} m={0.5} r={0.45} />
      {Array.from({ length: slats }).map((_, i) => (
        <Box key={i} p={[0, (i + 0.5) * (h / slats), 0]} s={[w, h / slats - 0.025, 0.05]} c={C.door} m={0.55} r={0.42} />
      ))}
      <Box p={[0, 0.25, 0.05]} s={[0.5, 0.05, 0.05]} c={C.steel} m={0.8} r={0.3} />
    </group>
  );
}

/** Painted parking bay outline + bay number plate on the wall */
function BayLines({ x }: { x: number }) {
  const len = 5.6;
  const half = BAY / 2 - 0.15;
  return (
    <group position={[x, 0.004, 0.4]}>
      {[-half, half].map((dx) => (
        <mesh key={dx} rotation={[-Math.PI / 2, 0, 0]} position={[dx, 0, 0]} raycast={() => null}>
          <planeGeometry args={[0.1, len]} />
          <meshStandardMaterial color={C.line} roughness={0.6} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -len / 2]} raycast={() => null}>
        <planeGeometry args={[half * 2 + 0.1, 0.1]} />
        <meshStandardMaterial color={C.line} roughness={0.6} />
      </mesh>
      {/* wheel stop */}
      <Box p={[0, 0.06, -len / 2 + 0.45]} s={[1.6, 0.12, 0.18]} c={C.yellow} r={0.6} />
    </group>
  );
}

function Tyres({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.13 + i * 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow raycast={() => null}>
          <torusGeometry args={[0.3, 0.12, 12, 32]} />
          <meshStandardMaterial color={C.rubber} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function ToolCabinet({ p, ry = 0 }: { p: [number, number, number]; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0.5, 0]} s={[1.4, 1, 0.55]} c={C.cabinet} m={0.3} r={0.35} />
      {[0.2, 0.42, 0.64, 0.86].map((y) => (
        <Box key={y} p={[0, y, 0.28]} s={[1.3, 0.015, 0.01]} c="#a86b00" r={0.5} />
      ))}
      <Box p={[0, 1.02, 0]} s={[1.45, 0.04, 0.6]} c={C.steel} m={0.7} r={0.3} />
      {/* top box */}
      <Box p={[0, 1.3, -0.05]} s={[1.3, 0.5, 0.45]} c={C.cabinet} m={0.3} r={0.35} />
    </group>
  );
}

function Workbench({ p, ry = 0 }: { p: [number, number, number]; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0.9, 0]} s={[2.2, 0.06, 0.7]} c={C.wood} r={0.8} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <Box key={`${sx}${sz}`} p={[sx * 1.02, 0.45, sz * 0.3]} s={[0.06, 0.9, 0.06]} c={C.steel} m={0.6} r={0.4} />),
      )}
      <Box p={[0, 0.25, 0]} s={[2.1, 0.03, 0.6]} c={C.steel} m={0.5} r={0.5} />
      {/* pegboard */}
      <Box p={[0, 1.7, -0.33]} s={[2.2, 1.2, 0.03]} c="#d9dde2" r={0.9} />
      {[-0.7, -0.3, 0.15, 0.6].map((x, i) => (
        <Box key={x} p={[x, 1.75 + (i % 2) * 0.15, -0.29]} s={[0.06, 0.35 + (i % 2) * 0.1, 0.04]} c={i % 2 ? "#4b5563" : C.cabinet} m={0.4} r={0.5} />
      ))}
    </group>
  );
}

function Extinguisher({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.28, 0]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.09, 0.09, 0.56, 16]} />
        <meshStandardMaterial color="#d61f26" roughness={0.35} metalness={0.2} />
      </mesh>
      <Box p={[0, 0.6, 0]} s={[0.08, 0.1, 0.08]} c="#222" r={0.5} />
    </group>
  );
}

/**
 * Bright, realistic multi-bay garage. `bays` parking spots are laid out along
 * +X starting at x = 0, each BAY metres apart, with a roller door behind each.
 */
export function GarageRoom({
  bays = 1,
  back = -5.2,
  front = 9,
  margin = 3.2,
  height = 4.6,
}: {
  bays?: number;
  /** back wall z (roller doors) */
  back?: number;
  /** front wall z (behind the camera) */
  front?: number;
  /** extra space left of the first and right of the last bay */
  margin?: number;
  /** ceiling height */
  height?: number;
}) {
  const H = height;
  const BACK = back;
  const FRONT = front;
  const n = Math.max(1, bays);
  const left = -BAY * 0.5 - margin;
  const right = (n - 1) * BAY + BAY * 0.5 + margin;
  const width = right - left;
  const cx = (left + right) / 2;
  const depth = FRONT - BACK;
  const cz = (FRONT + BACK) / 2;
  const panels = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < n; i++) for (const z of [-1.6, 1.4, 4.2]) out.push([i * BAY, z]);
    return out;
  }, [n]);

  return (
    <group>
      {/* epoxy floor with soft reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <MeshReflectorMaterial
          blur={[400, 120]}
          resolution={512}
          mixBlur={1}
          mixStrength={4}
          roughness={0.75}
          depthScale={0.6}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.4}
          color={C.floor}
          metalness={0.15}
          mirror={0}
        />
      </mesh>
      {/* yellow safety line along the back wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.003, BACK + 0.7]} raycast={() => null}>
        <planeGeometry args={[width, 0.12]} />
        <meshStandardMaterial color={C.yellow} roughness={0.6} />
      </mesh>

      {/* walls: white upper, grey lower band */}
      {(
        [
          [cx, BACK, width, 0],
          [cx, FRONT, width, Math.PI],
          [left, cz, depth, Math.PI / 2],
          [right, cz, depth, -Math.PI / 2],
        ] as [number, number, number, number][]
      ).map(([x, z, w, ry], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, ry, 0]}>
          <mesh position={[0, H / 2, 0]} receiveShadow raycast={() => null}>
            <planeGeometry args={[w, H]} />
            <meshStandardMaterial color={C.wall} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.6, 0.01]} raycast={() => null}>
            <planeGeometry args={[w, 1.2]} />
            <meshStandardMaterial color={C.band} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.21, 0.012]} raycast={() => null}>
            <planeGeometry args={[w, 0.05]} />
            <meshStandardMaterial color={C.cabinet} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* ceiling + LED panels */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[cx, H, cz]} raycast={() => null}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={C.ceiling} roughness={1} />
      </mesh>
      {panels.map(([x, z]) => (
        <Box key={`${x}${z}`} p={[x, H - 0.03, z]} s={[2.4, 0.04, 0.5]} c="#ffffff" e={2.2} />
      ))}

      {/* bays */}
      {Array.from({ length: n }).map((_, i) => (
        <group key={i}>
          <RollerDoor x={i * BAY} back={BACK} />
          <BayLines x={i * BAY} />
        </group>
      ))}

      {/* props along the side walls */}
      <ToolCabinet p={[left + 0.45, 0, -2.6]} ry={Math.PI / 2} />
      <Workbench p={[left + 0.45, 0, 1.4]} ry={Math.PI / 2} />
      <Tyres p={[right - 0.6, 0, BACK + 0.8]} />
      <Tyres p={[right - 1.35, 0, BACK + 0.7]} />
      <Extinguisher p={[right - 0.15, 0.9, 0.5]} />
      <Box p={[right - 0.2, 2.2, -1.5]} s={[0.35, 0.04, 2.4]} c={C.steel} m={0.6} r={0.4} />
      {[-2.4, -1.8, -1.1].map((z, i) => (
        <Box key={z} p={[right - 0.25, 2.42, z]} s={[0.3, 0.4, 0.45]} c={i === 1 ? "#3b82f6" : "#d6b98c"} r={0.8} />
      ))}
    </group>
  );
}

/** Lighting tuned for the bright garage */
export function GarageLights() {
  return (
    <>
      <hemisphereLight args={["#ffffff", "#9aa1a9", 0.7]} />
      <directionalLight position={[4, 9, 5]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
      <Environment resolution={256} frames={1} environmentIntensity={0.95}>
        <color attach="background" args={["#e9ecef"]} />
        <Lightformer form="rect" intensity={4} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[0, 5, 3]} rotation-x={Math.PI / 2} scale={[10, 1, 1]} />
        <Lightformer form="rect" intensity={2} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 2, 8]} scale={[10, 2, 1]} />
      </Environment>
    </>
  );
}
