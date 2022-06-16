import * as THREE from "three";
import { VRM, VRMSchema } from "@pixiv/three-vrm";

export function buildNodMotionTracks(
  vrm: VRM | undefined
): THREE.QuaternionKeyframeTrack[] {
  const buildTrack = (times: number[], values: [number, number, number][]) =>
    new THREE.QuaternionKeyframeTrack(
      vrm!.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName.Neck)!.name +
        ".quaternion",
      times,
      values.flatMap(([x, y, z]) =>
        new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray()
      ),
      THREE.InterpolateSmooth
    );

  const track1 = buildTrack(
    [0.0, 0.15, 0.35, 0.6, 0.9],
    [
      [0, 0, 0],
      [-0.06 * Math.PI, 0.0, 0.0],
      [0, 0, 0],
      [-0.06 * Math.PI, 0.0, 0.0],
      [0, 0, 0],
    ]
  );

  const track2 = buildTrack(
    [0.0, 0.32, 0.48, 0.8],
    [
      [0, 0, 0],
      [-0.09 * Math.PI, 0.0, 0.0],
      [-0.08 * Math.PI, 0.0, 0.0],
      [0, 0, 0],
    ]
  );

  return [track1, track2];
}

export function applyBlinkMotion(vrm: VRM | undefined, clock: THREE.Clock) {
  // https://qiita.com/blachocolat/items/2e16eb78328b7997de3c
  vrm?.blendShapeProxy?.setValue(
    VRMSchema.BlendShapePresetName.Blink,
    Math.sin((clock.elapsedTime * 1) / 3) ** 1024 +
      Math.sin((clock.elapsedTime * 4) / 7) ** 1024
  );
}

export function applyBreathMotion(vrm: VRM | undefined, clock: THREE.Clock) {
  vrm?.humanoid
    ?.getBoneNode(VRMSchema.HumanoidBoneName.Spine)
    ?.setRotationFromEuler(
      new THREE.Euler(
        ((0.8 - Math.sin(clock.elapsedTime) ** 4) * Math.PI) / 170,
        0.0,
        0.0
      )
    );
}
