import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRM, VRMUtils, VRMSchema } from "@pixiv/three-vrm";

import "./style.css";

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// camera
const camera = new THREE.PerspectiveCamera(
  30.0,
  window.innerWidth / window.innerHeight,
  0.1,
  20.0
);
camera.position.set(0.0, 1.0, 5.0);

// camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(0.0, 1.0, 0.0);
controls.update();

// scene
const scene = new THREE.Scene();

// light
const light = new THREE.DirectionalLight(0xffffff);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);

let currentVrm: VRM | undefined = undefined;
let currentMixer: THREE.AnimationMixer | undefined = undefined;

// gltf and vrm
const loader = new GLTFLoader();
loader.crossOrigin = "anonymous";
loader.load(
  // URL of the VRM you want to load
  "/models/AvatarSample_B.vrm",

  // called when the resource is loaded
  (gltf) => {
    // calling these functions greatly improves the performance
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    // generate VRM instance from gltf
    VRM.from(gltf).then((vrm) => {
      console.log(vrm);
      scene.add(vrm.scene);

      currentVrm = vrm;

      vrm.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName.Hips).rotation.y =
        Math.PI;
      vrm.springBoneManager!.reset();

      prepareAnimation(vrm);
    });
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

  const quatA = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0);
  const quatB = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0);
  quatB.setFromEuler(new THREE.Euler(0.0, 0.0, 0.25 * Math.PI));

  const armTrack = new THREE.QuaternionKeyframeTrack(
    vrm.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName.LeftUpperArm).name +
      ".quaternion", // name
    [0.0, 0.5, 1.0], // times
    [...quatA.toArray(), ...quatB.toArray(), ...quatA.toArray()] // values
  );

  const blinkTrack = new THREE.NumberKeyframeTrack(
    vrm.blendShapeProxy!.getBlendShapeTrackName(
      VRMSchema.BlendShapePresetName.Blink
    )!, // name
    [0.0, 0.5, 1.0], // times
    [0.0, 1.0, 0.0] // values
  );

  const clip = new THREE.AnimationClip("blink", 1.0, [armTrack, blinkTrack]);
  const action = currentMixer.clipAction(clip);
  action.play();
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

  if (currentVrm) {
    currentVrm.update(deltaTime);
  }

  if (currentMixer) {
    currentMixer.update(deltaTime);
  }

  renderer.render(scene, camera);
}

animate();
