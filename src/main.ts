import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRM, VRMUtils, VRMSchema } from "@pixiv/three-vrm";

import "./style.css";

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.querySelector("#app")!.appendChild(renderer.domElement);
document.querySelector("#controls button")!.addEventListener("click", (ev) => {
  // prepareAnimation(currentVrm!);
  currentAction?.reset().play();
});

// camera
const camera = new THREE.PerspectiveCamera(
  30.0,
  window.innerWidth / window.innerHeight,
  0.1,
  20.0
);
camera.position.set(0.0, 1.3, 1.0);

// camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(0.0, 1.3, 0.0);
controls.update();

// scene
const scene = new THREE.Scene();

// light
const light = new THREE.DirectionalLight(0xffffff);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);

let currentVrm: VRM | undefined;
let currentMixer: THREE.AnimationMixer | undefined;
let currentAction: THREE.AnimationAction | undefined;

// gltf and vrm
const loader = new GLTFLoader();
loader.crossOrigin = "anonymous";
loader.load(
  // URL of the VRM you want to load
  "/models/AvatarSample_B.vrm",

  // called when the resource is loaded
  async (gltf) => {
    // calling these functions greatly improves the performance
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    // generate VRM instance from gltf
    const vrm = await VRM.from(gltf);
    console.log(vrm);
    scene.add(vrm.scene);

    currentVrm = vrm;

    vrm.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName.Hips).rotation.y =
      Math.PI;
    vrm.springBoneManager!.reset();

    prepareAnimation(vrm);
  },

  // called while loading is progressing
  (progress) =>
    console.log(
      "Loading model...",
      100.0 * (progress.loaded / progress.total),
      "%"
    ),

  // called when loading has errors
  (error) => console.error(error)
);

// animation
function prepareAnimation(vrm: VRM) {
  currentMixer = new THREE.AnimationMixer(vrm.scene);

  const quatA = new THREE.Quaternion();
  const quatB = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-0.08 * Math.PI, 0.0, 0.0)
  );

  const headTrack = new THREE.QuaternionKeyframeTrack(
    vrm.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName.Head).name +
      ".quaternion", // name
    [0.0, 0.45, 0.9], // times
    [...quatA.toArray(), ...quatB.toArray(), ...quatA.toArray()] // values
  );

  const blinkTrack = new THREE.NumberKeyframeTrack(
    vrm.blendShapeProxy!.getBlendShapeTrackName(
      VRMSchema.BlendShapePresetName.Blink
    )!, // name
    [0.0, 0.45, 0.9], // times
    [0.0, 1.0, 0.0] // values
  );

  const clip = new THREE.AnimationClip("blink", 0.9, [headTrack, blinkTrack]);
  const action = currentMixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 1);
  action.play();
  currentAction = action;
}

// helpers
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // まばたき
  currentVrm?.update(deltaTime);
  // うなづき
  currentMixer?.update(deltaTime);

  renderer.render(scene, camera);
}

animate();
