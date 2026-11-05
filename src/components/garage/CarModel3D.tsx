"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { PartId } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Context: selection / hover / x-ray state shared by every part mesh */
/* ------------------------------------------------------------------ */

interface CarCtx {
  color: string;
  xray: boolean;
  selected: PartId | null;
  hovered: PartId | null;
  setHovered: (p: PartId | null) => void;
  onSelect: (p: PartId | null) => void;
  internalsOnly?: boolean;
  skipParts?: PartId[];
}
const Ctx = createContext<CarCtx>(null!);
const PartCtx = createContext<{ id: PartId; internal: boolean } | null>(null);

const HL = new THREE.Color("#22d3ee");
const BLACK = new THREE.Color("#000");

function Part({ id, internal = false, children }: { id: PartId; internal?: boolean; children: ReactNode }) {
  const { xray, onSelect, setHovered, internalsOnly, skipParts } = useContext(Ctx);
  if (skipParts?.includes(id)) return null;
  if (internal && !xray && id !== "brakes") return null;
  if (internalsOnly && !internal) return null;
  const clickable = internal ? true : !xray;
  return (
    <group
      onClick={
        clickable
          ? (e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onSelect(id);
            }
          : undefined
      }
      onPointerOver={
        clickable
          ? (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHovered(id);
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={
        clickable
          ? () => {
              setHovered(null);
              document.body.style.cursor = "";
            }
          : undefined
      }
    >
      <PartCtx.Provider value={{ id, internal }}>{children}</PartCtx.Provider>
    </group>
  );
}

type MatKind = "paint" | "glass" | "chrome" | "rubber" | "dark" | "metal" | "head" | "tail" | "red" | "engine";

/** Material that reacts to selection, hover and x-ray mode */
function M({ kind }: { kind: MatKind }) {
  const { color, xray, selected, hovered } = useContext(Ctx);
  const part = useContext(PartCtx);
  const active = part && selected === part.id;
  const hover = part && hovered === part.id;
  const ghost = xray && !part?.internal && kind !== "rubber" && kind !== "chrome";
  const emissive = active ? HL : hover ? HL : BLACK;
  const emissiveIntensity = active ? 0.9 : hover ? 0.35 : 0;

  if (ghost) {
    return (
      <meshPhysicalMaterial
        color={active ? "#22d3ee" : "#9fe8ff"}
        transparent
        opacity={active ? 0.35 : 0.07}
        depthWrite={false}
        roughness={0.2}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    );
  }

  switch (kind) {
    case "paint":
      return (
        <meshPhysicalMaterial
          color={color}
          metalness={0.55}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.04}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      );
    case "glass":
      return (
        <meshPhysicalMaterial
          color="#06090d"
          metalness={0.3}
          roughness={0.04}
          clearcoat={1}
          transparent
          opacity={0.92}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      );
    case "chrome":
      return <meshStandardMaterial color="#d9dde2" metalness={1} roughness={0.18} emissive={emissive} emissiveIntensity={emissiveIntensity} />;
    case "rubber":
      return <meshStandardMaterial color="#0c0c0d" roughness={0.9} emissive={emissive} emissiveIntensity={emissiveIntensity * 0.6} />;
    case "dark":
      return <meshStandardMaterial color="#0d0f12" roughness={0.6} metalness={0.3} emissive={emissive} emissiveIntensity={emissiveIntensity} />;
    case "metal":
      return <meshStandardMaterial color="#6b7480" roughness={0.35} metalness={0.9} emissive={emissive} emissiveIntensity={emissiveIntensity} />;
    case "engine":
      return (
        <meshStandardMaterial
          color={active ? "#22d3ee" : "#ff7a3d"}
          roughness={0.4}
          metalness={0.6}
          emissive={active ? HL : new THREE.Color("#ff5a1f")}
          emissiveIntensity={active ? 1 : hover ? 0.7 : 0.35}
        />
      );
    case "red":
      return <meshStandardMaterial color="#c4141f" roughness={0.4} metalness={0.4} emissive={emissive} emissiveIntensity={emissiveIntensity} />;
    case "head":
      return <meshStandardMaterial color="#ffffff" emissive={active || hover ? HL : new THREE.Color("#fff6dc")} emissiveIntensity={2.2} toneMapped={false} />;
    case "tail":
      return <meshStandardMaterial color="#ff1a2a" emissive={active || hover ? HL : new THREE.Color("#ff1020")} emissiveIntensity={2} toneMapped={false} />;
  }
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

type Body = "sedan" | "suv" | "hatch" | "van";

const DIM: Record<Body, { lift: number; cabinH: number; cabinTop: [number, number]; cabinBase: [number, number]; trunkLen: number }> = {
  sedan: { lift: 0, cabinH: 0.5, cabinBase: [-1.45, 1.1], cabinTop: [-0.95, 0.42], trunkLen: 0.8 },
  hatch: { lift: 0.02, cabinH: 0.52, cabinBase: [-2.05, 1.1], cabinTop: [-1.85, 0.42], trunkLen: 0 },
  van: { lift: 0.3, cabinH: 0.9, cabinBase: [-2.25, 1.2], cabinTop: [-2.22, 0.72], trunkLen: 0 },
  suv: { lift: 0.18, cabinH: 0.62, cabinBase: [-2.1, 1.05], cabinTop: [-2.02, 0.5], trunkLen: 0 },
};

function Cabin({ body }: { body: Body }) {
  const d = DIM[body];
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(d.cabinBase[0], 0);
    s.lineTo(d.cabinBase[1], 0);
    s.lineTo(d.cabinTop[1], d.cabinH);
    s.lineTo(d.cabinTop[0], d.cabinH);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.48, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
    g.translate(0, 0, -0.74);
    return g;
  }, [d]);
  const roofLen = d.cabinTop[1] - d.cabinTop[0];
  return (
    <>
      <Part id="glass">
        <mesh geometry={geo} position={[0, 0.86 + d.lift, 0]} castShadow>
          <M kind="glass" />
        </mesh>
        {/* B-pillar */}
        <mesh position={[0.05, 0.86 + d.lift + d.cabinH / 2, 0]}>
          <boxGeometry args={[0.08, d.cabinH, 1.6]} />
          <M kind="dark" />
        </mesh>
      </Part>
      <Part id="roof">
        <RoundedBox
          args={[roofLen + 0.08, 0.06, 1.56]}
          radius={0.03}
          position={[(d.cabinTop[0] + d.cabinTop[1]) / 2, 0.86 + d.lift + d.cabinH + 0.04, 0]}
          castShadow
        >
          <M kind="paint" />
        </RoundedBox>
      </Part>
    </>
  );
}

function Wheel({ position, side }: { position: [number, number, number]; side: 1 | -1 }) {
  return (
    <group position={position}>
      <Part id="wheels">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.26, 40]} />
          <M kind="rubber" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.12]}>
          <cylinderGeometry args={[0.24, 0.24, 0.04, 32]} />
          <M kind="chrome" />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[0, 0, side * 0.145]} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
            <boxGeometry args={[0.05, 0.42, 0.02]} />
            <M kind="metal" />
          </mesh>
        ))}
      </Part>
      <Part id="brakes" internal>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.08]}>
          <cylinderGeometry args={[0.2, 0.2, 0.03, 28]} />
          <M kind="metal" />
        </mesh>
        <mesh position={[0.12, 0.12, side * 0.1]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.16, 0.05]} />
          <M kind="red" />
        </mesh>
      </Part>
    </group>
  );
}

function Spring({ position }: { position: [number, number, number] }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const a = t * Math.PI * 2 * 6;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.08, t * 0.34, Math.sin(a) * 0.08));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.012, 6, false);
  }, []);
  return (
    <group position={position}>
      <mesh geometry={geo}>
        <M kind="engine" />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.42, 8]} />
        <M kind="metal" />
      </mesh>
    </group>
  );
}

/** Pulsing marker over parts that have logged repairs */
export function Marker({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.25;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={position} raycast={() => null}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial color="#ff5a1f" toneMapped={false} />
    </mesh>
  );
}

export const PART_ANCHORS: Record<PartId, [number, number, number]> = {
  engine: [1.6, 1.15, 0],
  transmission: [0.7, 0.75, 0],
  battery: [1.85, 1.1, -0.6],
  exhaust: [-2.35, 0.3, 0.45],
  suspension: [1.42, 1.0, 0.82],
  brakes: [-1.42, 0.8, 0.98],
  wheels: [1.42, 0.8, 1.0],
  hood: [1.7, 1.05, 0.3],
  trunk: [-1.85, 1.05, 0],
  roof: [-0.3, 1.55, 0],
  front_bumper: [2.45, 0.6, 0],
  rear_bumper: [-2.45, 0.6, 0],
  door_fl: [0.6, 0.65, 1.0],
  door_fr: [0.6, 0.65, -1.0],
  door_rl: [-0.5, 0.65, 1.0],
  door_rr: [-0.5, 0.65, -1.0],
  headlights: [2.4, 0.85, 0.6],
  taillights: [-2.4, 0.85, 0.6],
  glass: [0.6, 1.35, 0],
  mirrors: [1.0, 1.1, 1.1],
};

export interface CarModel3DProps {
  color: string;
  body: Body;
  xray: boolean;
  selected: PartId | null;
  hovered: PartId | null;
  setHovered: (p: PartId | null) => void;
  onSelect: (p: PartId | null) => void;
  marked: PartId[];
  /** Render only the mechanical internals (used on top of a real GLB model in x-ray mode) */
  internalsOnly?: boolean;
  skipParts?: PartId[];
}

export function CarModel3D({ marked, body, ...ctx }: CarModel3DProps) {
  const d = DIM[body];
  const L = d.lift;
  const skipKey = ctx.skipParts?.join();
  const value = useMemo(() => ({ ...ctx }), [ctx.color, ctx.xray, ctx.selected, ctx.hovered, ctx.setHovered, ctx.onSelect, ctx.internalsOnly, skipKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const shell = !ctx.internalsOnly;
  const doorY = 0.62 + L;
  const doorH = 0.48 + L * 0.6;

  return (
    <Ctx.Provider value={value}>
      <group position={[0, L * 0.5, 0]}>
        {/* Core body shell (not a selectable part) */}
        {shell && (
        <RoundedBox args={[4.5, 0.56 + L, 1.74]} radius={0.14} smoothness={4} position={[0, 0.6 + L / 2, 0]} castShadow receiveShadow>
          <M kind="paint" />
        </RoundedBox>
        )}
        {/* sill / underbody */}
        {shell && (
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[4.2, 0.1, 1.7]} />
          <meshStandardMaterial color="#08090b" roughness={0.9} transparent={ctx.xray} opacity={ctx.xray ? 0.15 : 1} />
        </mesh>
        )}

        <Cabin body={body} />

        <Part id="hood">
          <RoundedBox args={[1.12, 0.06, 1.66]} radius={0.03} position={[1.66, 0.9 + L, 0]} rotation={[0, 0, -0.05]} castShadow>
            <M kind="paint" />
          </RoundedBox>
        </Part>

        {d.trunkLen > 0 ? (
          <Part id="trunk">
            <RoundedBox args={[d.trunkLen, 0.06, 1.66]} radius={0.03} position={[-1.86, 0.9 + L, 0]} rotation={[0, 0, 0.04]} castShadow>
              <M kind="paint" />
            </RoundedBox>
          </Part>
        ) : (
          <Part id="trunk">
            <RoundedBox args={[0.06, 0.5 + L, 1.5]} radius={0.02} position={[-2.27, 0.7 + L, 0]} castShadow>
              <M kind="paint" />
            </RoundedBox>
          </Part>
        )}

        <Part id="front_bumper">
          <RoundedBox args={[0.24, 0.42, 1.82]} radius={0.09} position={[2.24, 0.5 + L * 0.4, 0]} castShadow>
            <M kind="paint" />
          </RoundedBox>
          <mesh position={[2.365, 0.6 + L * 0.4, 0]}>
            <boxGeometry args={[0.02, 0.16, 0.74]} />
            <M kind="dark" />
          </mesh>
          <mesh position={[2.365, 0.38 + L * 0.4, 0]}>
            <boxGeometry args={[0.02, 0.08, 1.1]} />
            <M kind="dark" />
          </mesh>
        </Part>

        <Part id="rear_bumper">
          <RoundedBox args={[0.24, 0.42, 1.82]} radius={0.09} position={[-2.24, 0.5 + L * 0.4, 0]} castShadow>
            <M kind="paint" />
          </RoundedBox>
          <mesh position={[-2.365, 0.38 + L * 0.4, 0]}>
            <boxGeometry args={[0.02, 0.06, 1.2]} />
            <M kind="dark" />
          </mesh>
        </Part>

        <Part id="headlights">
          {[-1, 1].map((s) => (
            <mesh key={s} position={[2.3, 0.76 + L * 0.7, s * 0.6]}>
              <boxGeometry args={[0.1, 0.09, 0.4]} />
              <M kind="head" />
            </mesh>
          ))}
        </Part>

        <Part id="taillights">
          {[-1, 1].map((s) => (
            <mesh key={s} position={[-2.3, 0.78 + L * 0.7, s * 0.6]}>
              <boxGeometry args={[0.08, 0.09, 0.42]} />
              <M kind="tail" />
            </mesh>
          ))}
          <mesh position={[-2.3, 0.78 + L * 0.7, 0]}>
            <boxGeometry args={[0.07, 0.025, 0.8]} />
            <M kind="tail" />
          </mesh>
        </Part>

        {/* Doors: [id, xCenter, side] */}
        {(
          [
            ["door_fl", 0.58, 1],
            ["door_rl", -0.48, 1],
            ["door_fr", 0.58, -1],
            ["door_rr", -0.48, -1],
          ] as [PartId, number, 1 | -1][]
        ).map(([id, x, s]) => (
          <Part key={id} id={id}>
            <RoundedBox args={[1.04, doorH, 0.04]} radius={0.015} position={[x, doorY, s * 0.885]} castShadow>
              <M kind="paint" />
            </RoundedBox>
            <mesh position={[x - 0.25, doorY + 0.12, s * 0.91]}>
              <boxGeometry args={[0.16, 0.035, 0.02]} />
              <M kind="chrome" />
            </mesh>
          </Part>
        ))}
        {/* door gaps */}
        {shell && [1.1, 0.05, -1.0].map((x) =>
          [-1, 1].map((s) => (
            <mesh key={`${x}${s}`} position={[x, doorY, s * 0.9]} raycast={() => null}>
              <boxGeometry args={[0.012, doorH, 0.01]} />
              <meshBasicMaterial color="#000" transparent opacity={ctx.xray ? 0.1 : 0.7} />
            </mesh>
          )),
        )}

        <Part id="mirrors">
          {[-1, 1].map((s) => (
            <RoundedBox key={s} args={[0.2, 0.11, 0.14]} radius={0.03} position={[1.02, 0.98 + L, s * 0.98]} castShadow>
              <M kind="paint" />
            </RoundedBox>
          ))}
        </Part>

        {/* Wheels */}
        {(
          [
            [1.42, 1],
            [1.42, -1],
            [-1.42, 1],
            [-1.42, -1],
          ] as [number, 1 | -1][]
        ).map(([x, s]) => (
          <Wheel key={`${x}${s}`} position={[x, 0.36 - L * 0.5, s * 0.8]} side={s} />
        ))}

        {/* ---------- internals (x-ray) ---------- */}
        <Part id="engine" internal>
          <mesh position={[1.62, 0.64 + L, 0]}>
            <boxGeometry args={[0.72, 0.42, 0.78]} />
            <M kind="engine" />
          </mesh>
          {[-0.24, -0.08, 0.08, 0.24].map((z) => (
            <mesh key={z} position={[1.62, 0.9 + L, z]}>
              <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
              <M kind="metal" />
            </mesh>
          ))}
        </Part>
        <Part id="transmission" internal>
          <mesh position={[0.82, 0.48 + L * 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.22, 0.9, 20]} />
            <M kind="engine" />
          </mesh>
          <mesh position={[-0.6, 0.38 + L * 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 1.9, 10]} />
            <M kind="metal" />
          </mesh>
        </Part>
        <Part id="battery" internal>
          <mesh position={[1.86, 0.78 + L, -0.6]}>
            <boxGeometry args={[0.26, 0.2, 0.18]} />
            <M kind="engine" />
          </mesh>
        </Part>
        <Part id="exhaust" internal>
          <mesh position={[-0.9, 0.26, 0.42]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 2.7, 10]} />
            <M kind="engine" />
          </mesh>
          <mesh position={[-1.75, 0.28, 0.42]}>
            <boxGeometry args={[0.6, 0.18, 0.34]} />
            <M kind="engine" />
          </mesh>
        </Part>
        <Part id="suspension" internal>
          {[
            [1.42, 0.8],
            [1.42, -0.8],
            [-1.42, 0.8],
            [-1.42, -0.8],
          ].map(([x, z]) => (
            <Spring key={`${x}${z}`} position={[x, 0.42, z * 0.82]} />
          ))}
        </Part>
        {/* exhaust tip is always visible */}
        {shell && (
        <mesh position={[-2.37, 0.28, 0.45]} rotation={[0, 0, Math.PI / 2]} raycast={() => null}>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 16]} />
          <meshStandardMaterial color="#cfd3d8" metalness={1} roughness={0.2} />
        </mesh>

        )}
        {marked.map((p) => (
          <Marker key={p} position={PART_ANCHORS[p]} />
        ))}
      </group>
    </Ctx.Provider>
  );
}
