"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { PerspectiveCamera } from "three";

function applyFov(camera: PerspectiveCamera, fov: number) {
  camera.fov = fov;
  camera.updateProjectionMatrix();
}

/** Widen the camera on portrait screens so the whole car stays in frame */
export function ResponsiveFov({ landscape = 40, portrait = 58 }: { landscape?: number; portrait?: number }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  useEffect(() => {
    const aspect = width / Math.max(1, height);
    // blend between the two values for in-between aspect ratios
    const t = Math.min(1, Math.max(0, (1.4 - aspect) / 0.8));
    applyFov(camera, landscape + (portrait - landscape) * t);
  }, [camera, width, height, landscape, portrait]);
  return null;
}
