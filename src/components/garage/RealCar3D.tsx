"use client";

import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE_PAINT_NAME, PART_RULES, type Model3D } from "@/lib/data/models3d";
import { PARTS } from "@/lib/data/parts";
import type { PartId } from "@/lib/types";
import { CarModel3D, Marker, PART_ANCHORS, type CarModel3DProps } from "./CarModel3D";

/** Every model is normalised to this length (same as the schematic car) so anchors and internals line up */
const TARGET_LEN = 4.5;
/** Reference dimensions of the schematic car that PART_ANCHORS were authored for */
const REF = { halfL: 2.3, H: 1.45, halfW: 0.9 };

const INTERNAL = new Set(PARTS.filter((p) => p.internal).map((p) => p.id));
const EXTERIOR = PARTS.filter((p) => !p.internal).map((p) => p.id);
const HL = new THREE.Color("#22d3ee");
const NOOP_RAYCAST = () => {};

type Std = THREE.MeshStandardMaterial;
interface MeshData {
  part: PartId | null;
  paint: boolean;
  orig: { transparent: boolean; opacity: number; depthWrite: boolean; emissive: THREE.Color; emissiveIntensity: number }[];
}

function matchPart(names: string[], rules: [RegExp, PartId][]): PartId | null {
  for (const n of names) {
    if (!n) continue;
    for (const [re, part] of rules) if (re.test(n)) return part;
  }
  return null;
}

const mats = (m: THREE.Mesh) => (Array.isArray(m.material) ? m.material : [m.material]) as Std[];

/** Read a texture's pixels once (ImageBitmap / <img> / canvas all work with drawImage) */
const pixelCache = new WeakMap<object, { data: Uint8ClampedArray; w: number; h: number }>();
function texturePixels(tex: THREE.Texture) {
  const img = tex.image as CanvasImageSource & { width: number; height: number };
  if (!img?.width) return null;
  const hit = pixelCache.get(img);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const out = { data: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
  pixelCache.set(img, out);
  return out;
}

/**
 * Palette-textured models paint the whole car with one material. Split the
 * triangles that sample the body colour into their own material group so the
 * body can be recoloured without touching tyres, lights or trim.
 */
function splitByPalette(mesh: THREE.Mesh, key: NonNullable<Model3D["paletteKey"]>) {
  if (Array.isArray(mesh.material)) return;
  const mat = mesh.material as Std;
  const px = mat.map ? texturePixels(mat.map) : null;
  const uv = mesh.geometry.getAttribute("uv");
  if (!px || !uv) return;
  const geo = mesh.geometry.clone(); // geometry is shared with the GLTF cache
  const index = geo.index ? Array.from(geo.index.array) : Array.from({ length: uv.count }, (_, i) => i);
  mat.map!.updateMatrix();
  const m = mat.map!.matrix;
  const tol = key.tol ?? 8;
  const v = new THREE.Vector2();
  const paint: number[] = [];
  const rest: number[] = [];
  for (let t = 0; t < index.length; t += 3) {
    let u = 0;
    let w = 0;
    for (let k = 0; k < 3; k++) {
      u += uv.getX(index[t + k]);
      w += uv.getY(index[t + k]);
    }
    v.set(u / 3, w / 3).applyMatrix3(m);
    const x = Math.min(px.w - 1, Math.max(0, Math.floor((((v.x % 1) + 1) % 1) * px.w)));
    const y = Math.min(px.h - 1, Math.max(0, Math.floor((((v.y % 1) + 1) % 1) * px.h)));
    const o = (y * px.w + x) * 4;
    const hit =
      Math.abs(px.data[o] - key.rgb[0]) <= tol &&
      Math.abs(px.data[o + 1] - key.rgb[1]) <= tol &&
      Math.abs(px.data[o + 2] - key.rgb[2]) <= tol;
    (hit ? paint : rest).push(index[t], index[t + 1], index[t + 2]);
  }
  if (!paint.length) return;
  geo.setIndex([...paint, ...rest]);
  geo.clearGroups();
  geo.addGroup(0, paint.length, 0);
  geo.addGroup(paint.length, rest.length, 1);
  mesh.geometry = geo;
  const paintMat = new THREE.MeshPhysicalMaterial({
    name: PALETTE_PAINT_NAME,
    metalness: 0.55,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  mesh.material = [paintMat, mat];
}

function isPaint(m: Std, cfg: Model3D) {
  if (cfg.paint?.test(m.name)) return true;
  const k = cfg.paintColor;
  return !!k && !!m.color && Math.abs(m.color.r - k[0]) < 0.04 && Math.abs(m.color.g - k[1]) < 0.04 && Math.abs(m.color.b - k[2]) < 0.04;
}

/**
 * Sketchfab uploads often ship a floor or backdrop plane. A sheet that is
 * paper-thin and spans (almost) the whole model in its other two axes is not
 * part of the car — hide it so it doesn't skew sizing or show up in the garage.
 */
function removeStagePlanes(root: THREE.Object3D, meshes: THREE.Mesh[]) {
  root.updateMatrixWorld(true);
  const all = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).toArray();
  const max = Math.max(...all);
  return meshes.filter((m) => {
    const sz = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3()).toArray();
    const thin = sz.findIndex((v) => v < max * 0.004);
    if (thin === -1) return true;
    const spans = sz.every((v, i) => i === thin || v >= all[i] * 0.9);
    if (spans) m.removeFromParent();
    return !spans;
  });
}

/** Clone, align (nose → +X), scale, ground and tag every mesh with a part id */
function prepare(scene: THREE.Object3D, cfg: Model3D) {
  const root = scene.clone(true);
  const rules = [...(cfg.partRules ?? []), ...PART_RULES];
  const meshes: THREE.Mesh[] = [];

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
    if (cfg.paletteKey) splitByPalette(mesh, cfg.paletteKey);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const list = mats(mesh);
    const names = [mesh.name, mesh.parent?.name ?? "", ...list.map((m) => m.name)];
    const data: MeshData = {
      part: matchPart(names, rules),
      paint: list.map((m) => (m.userData.isPaint = isPaint(m, cfg))).some(Boolean),
      orig: list.map((m) => ({
        transparent: m.transparent,
        opacity: m.opacity,
        depthWrite: m.depthWrite,
        emissive: m.emissive?.clone() ?? new THREE.Color(0),
        emissiveIntensity: m.emissiveIntensity ?? 1,
      })),
    };
    mesh.userData.car = data;
    meshes.push(mesh);
  });

  const kept = removeStagePlanes(root, meshes);
  meshes.length = 0;
  meshes.push(...kept);

  // Align the longest horizontal axis with X
  const inner = new THREE.Group();
  inner.add(root);
  let box = new THREE.Box3().setFromObject(inner);
  let size = box.getSize(new THREE.Vector3());
  if (size.z > size.x) inner.rotation.y = Math.PI / 2;
  inner.updateMatrixWorld(true);

  // Nose direction: headlights should end up at +X
  const lights = meshes.filter((m) => (m.userData.car as MeshData).part === "headlights");
  const tails = meshes.filter((m) => (m.userData.car as MeshData).part === "taillights");
  const centerX = (list: THREE.Mesh[]) =>
    list.length ? new THREE.Box3().setFromObject(list[0]).getCenter(new THREE.Vector3()).x : null;
  const hx = centerX(lights);
  const tx = centerX(tails);
  box = new THREE.Box3().setFromObject(inner);
  const midX = (box.min.x + box.max.x) / 2;
  const noseNegative = hx !== null ? hx < midX : tx !== null ? tx > midX : false;
  if (noseNegative !== !!cfg.flip) inner.rotation.y += Math.PI;
  inner.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(inner);
  size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const s = TARGET_LEN / size.x;
  const outer = new THREE.Group();
  outer.add(inner);
  outer.scale.setScalar(s);
  outer.position.set(-center.x * s, -box.min.y * s, -center.z * s);

  const found = new Set(meshes.map((m) => (m.userData.car as MeshData).part).filter(Boolean) as PartId[]);
  return { object: outer, meshes, dims: { L: size.x * s, H: size.y * s, W: size.z * s }, found };
}

function applyVisualState(meshes: THREE.Mesh[], xray: boolean, selected: PartId | null, hovered: PartId | null) {
  for (const m of meshes) {
    const d = m.userData.car as MeshData;
    const internal = d.part ? INTERNAL.has(d.part) : false;
    const keep = internal || d.part === "wheels";
    const ghost = xray && !keep;
    m.raycast = ghost ? NOOP_RAYCAST : THREE.Mesh.prototype.raycast;
    mats(m).forEach((mat, i) => {
      const o = d.orig[i];
      const active = d.part !== null && d.part === selected;
      const hover = d.part !== null && d.part === hovered;
      const wantTransparent = ghost ? true : o.transparent;
      if (mat.transparent !== wantTransparent) mat.needsUpdate = true;
      mat.transparent = wantTransparent;
      mat.opacity = ghost ? (active ? 0.3 : 0.06) : o.opacity;
      mat.depthWrite = ghost ? false : o.depthWrite;
      if (!mat.emissive) return;
      if (active || hover) {
        mat.emissive.copy(HL);
        mat.emissiveIntensity = active ? 0.9 : 0.35;
      } else if (xray && internal) {
        mat.emissive.set("#ff5a1f");
        mat.emissiveIntensity = 0.5;
      } else {
        mat.emissive.copy(o.emissive);
        mat.emissiveIntensity = o.emissiveIntensity;
      }
    });
  }
}

export function RealCar3D({ model, marked, ...ctx }: CarModel3DProps & { model: Model3D }) {
  const { scene } = useGLTF(model.url);
  const { object, meshes, dims, found } = useMemo(() => prepare(scene, model), [scene, model]);
  const groupRef = useRef<THREE.Group>(null);
  const { color, xray, selected, hovered, onSelect, setHovered } = ctx;

  // Paint colour
  useEffect(() => {
    for (const m of meshes) {
      if (!(m.userData.car as MeshData).paint) continue;
      for (const mat of mats(m)) {
        if (!mat.userData.isPaint) continue;
        if (model.paintClearMap && mat.map) {
          mat.map = null;
          mat.needsUpdate = true;
        }
        mat.color.set(color);
      }
    }
  }, [meshes, color, model]);

  // Highlight + x-ray (three.js objects are mutated imperatively)
  useEffect(() => applyVisualState(meshes, xray, selected, hovered), [meshes, xray, selected, hovered]);

  /** Part from mesh name, otherwise the nearest exterior anchor to the hit point */
  const resolve = (e: ThreeEvent<PointerEvent | MouseEvent>): PartId | null => {
    const d = e.object.userData.car as MeshData | undefined;
    if (d?.part) return d.part;
    if (xray || !groupRef.current) return null;
    const p = groupRef.current.worldToLocal(e.point.clone());
    const n = [p.x / (dims.L / 2), p.y / dims.H, p.z / (dims.W / 2)];
    let best: PartId | null = null;
    let bestD = Infinity;
    for (const id of EXTERIOR) {
      const a = PART_ANCHORS[id];
      const dd = (n[0] - a[0] / REF.halfL) ** 2 + (n[1] - a[1] / REF.H) ** 2 + (n[2] - a[2] / REF.halfW) ** 2;
      if (dd < bestD) {
        bestD = dd;
        best = id;
      }
    }
    return best;
  };

  const anchor = (id: PartId): [number, number, number] => {
    const a = PART_ANCHORS[id];
    return [(a[0] / REF.halfL) * (dims.L / 2), (a[1] / REF.H) * dims.H, (a[2] / REF.halfW) * (dims.W / 2)];
  };

  return (
    <group ref={groupRef}>
      <primitive
        object={object}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          const p = resolve(e);
          if (!p) return;
          e.stopPropagation();
          onSelect(p);
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          const p = resolve(e);
          if (!p) return;
          e.stopPropagation();
          setHovered(p);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = "";
        }}
      />
      {/* Schematic internals for parts the file doesn't model (x-ray only) */}
      {xray && <CarModel3D {...ctx} body="sedan" marked={[]} internalsOnly skipParts={[...found]} />}
      {marked.map((p) => (
        <Marker key={p} position={anchor(p)} />
      ))}
    </group>
  );
}

export function preloadCar(url: string) {
  useGLTF.preload(url);
}
