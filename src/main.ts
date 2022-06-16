import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRM, VRMUtils, VRMSchema } from "@pixiv/three-vrm";
import { debounce } from "debounce";

import "./style.css";

declare var webkitSpeechRecognition: any;

// TODO: slider UI
const Config = {
  speakingDebounceDelay: 200,
  speakingChance: 0.1,
};

// TODO: sync with eyes
let enabled: boolean = false;

function startRecognition() {
  const recog = new webkitSpeechRecognition();
  recog.interimResults = true;
  recog.lang = "ja-JP";
  recog.continuous = true;
  recog.addEventListener("soundstart", () => {
    console.log("onsoundstart");
  });
  recog.addEventListener("soundend", () => {
    console.log("onsoundend");
  });
  recog.addEventListener("nomatch", () => {
    console.log("nomatch");
  });
  recog.addEventListener("error", (ev: any) => {
    console.log("error", ev);
  });
  const nodRandomly = debounce(() => {
    console.log("debounce");
    if (Math.random() < Config.speakingChance) {
      nod();
    }
  }, Config.speakingDebounceDelay);
  recog.onresult = (ev: any) => {
    // console.log(
    //   ...[...ev.results].map((result) => [...result].map((r) => r.transcript))
    // );
    const isFinal = ev.results[ev.results.length - 1].isFinal;
    console.log(
      { isFinal },
      ev.results.length,
      ev.results[ev.results.length - 1][0].transcript
    );
    if (isFinal) {
      nod();
    } else {
      nodRandomly();
    }
  };
  recog.onend = (ev: any) => {
    console.log("onend", ev);
    startRecognition();
  };
  recog.start();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.querySelector("#app")!.appendChild(renderer.domElement);
document
  .querySelector("#controls button#nod")!
  .addEventListener("click", (ev) => {
    nod();
  });

document
  .querySelector("#controls button#recog")!
  .addEventListener("click", (ev) => {
    startRecognition();
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
  // "/models/masawada.vrm",
  "/models/AvatarSample_B.vrm",
  // called when the resource is loaded
  async (gltf) => {
    // calling these functions greatly improves the performance
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    // generate VRM instance from gltf
    const vrm = await VRM.from(gltf);
    scene.add(vrm.scene);

    currentVrm = vrm;

    // https://scrapbox.io/ke456memo/%2323_%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6%E4%B8%8A%E3%81%A7VRM%E3%81%AE%E8%BA%AB%E9%95%B7%E3%82%84%E3%83%9D%E3%83%AA%E3%82%B4%E3%83%B3%E6%95%B0%E3%82%92%E7%A2%BA%E8%AA%8D%E3%81%A7%E3%81%8D%E3%82%8B%E3%83%84%E3%83%BC%E3%83%AB%E3%81%AE%E9%96%8B%E7%99%BA#602f3bac7ccd070000b0e3ff
    const eyePositionY = vrm.firstPerson?.firstPersonBone.getWorldPosition(
      new THREE.Vector3()
    ).y!;

    controls.target.set(0.0, eyePositionY, 0.0);
    camera.position.set(0.0, eyePositionY, 1.0);

    controls.update();

    vrm.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName.Hips)!.rotation.y =
      Math.PI;
    vrm.humanoid!.getBoneNode(
      VRMSchema.HumanoidBoneName.LeftUpperArm
    )!.rotation.z = Math.PI / 3;
    vrm.humanoid!.getBoneNode(
      VRMSchema.HumanoidBoneName.RightUpperArm
    )!.rotation.z = -Math.PI / 3;
    vrm.springBoneManager!.reset();

    vrm.lookAt!.target! = camera;

    prepareAnimation(vrm);

    startRecognition();
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

let nodActions: THREE.AnimationAction[] | undefined;
function nod() {
  if (!nodActions) return;
  currentAction?.reset();
  currentAction = nodActions[Math.floor(Math.random() * nodActions.length)];
  currentAction.play();
}

// animation
function prepareAnimation(vrm: VRM) {
  currentMixer = new THREE.AnimationMixer(vrm.scene);

  const nodTrack = new THREE.QuaternionKeyframeTrack(
    `${
      vrm.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName.Neck)!.name
    }.quaternion`,
    [0.0, 0.15, 0.35, 0.6, 0.9], // times
    [
      ...new THREE.Quaternion().toArray(),
      ...new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(-0.06 * Math.PI, 0.0, 0.0))
        .toArray(),
      ...new THREE.Quaternion().toArray(),
      ...new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(-0.06 * Math.PI, 0.0, 0.0))
        .toArray(),
      ...new THREE.Quaternion().toArray(),
    ] // values
  );

  const nodTrack2 = new THREE.QuaternionKeyframeTrack(
    `${
      vrm.humanoid!.getBoneNode(VRMSchema.HumanoidBoneName.Neck)!.name
    }.quaternion`,
    [0.0, 0.35, 0.45, 0.8],
    [
      ...new THREE.Quaternion().toArray(),
      ...new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(-0.09 * Math.PI, 0.0, 0.0))
        .toArray(),
      ...new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(-0.08 * Math.PI, 0.0, 0.0))
        .toArray(),
      ...new THREE.Quaternion().toArray(),
    ]
  );

  const nodAction = currentMixer
    .clipAction(new THREE.AnimationClip("nod", 1.0, [nodTrack]))
    .setLoop(THREE.LoopOnce, 1);
  const nodAction2 = currentMixer
    .clipAction(new THREE.AnimationClip("nod", 1.0, [nodTrack2]))
    .setLoop(THREE.LoopOnce, 1);

  nodActions = [nodAction, nodAction2];
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

  // うなづき
  currentMixer?.update(deltaTime);

  currentVrm?.blendShapeProxy?.setValue(
    VRMSchema.BlendShapePresetName.Blink,
    Math.sin((clock.elapsedTime * 1) / 3) ** 1024 +
      Math.sin((clock.elapsedTime * 4) / 7) ** 1024
  );

  currentVrm?.humanoid
    ?.getBoneNode(VRMSchema.HumanoidBoneName.Spine)
    ?.setRotationFromEuler(
      new THREE.Euler(
        ((0.8 - Math.sin(clock.elapsedTime) ** 4) * Math.PI) / 170,
        0.0,
        0.0
      )
    );

  // まばたき
  currentVrm?.update(deltaTime);

  renderer.render(scene, camera);
}

animate();
