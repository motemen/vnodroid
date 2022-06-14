import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRM } from "@pixiv/three-vrm";

import "./style.css";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// camera.position.z = 2;
camera.position.y = 1.2;
camera.position.z = -1;
camera.rotation.y = Math.PI * 1;

// camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(0.0, 1.0, 0.0);
controls.update();

const loader = new GLTFLoader();
loader.load(
  // URL of the VRM you want to load
  "/models/AvatarSample_B.vrm",

  // called when the resource is loaded
  (gltf) => {
    // generate a VRM instance from gltf
    VRM.from(gltf).then((vrm) => {
      // add the loaded vrm to the scene
      scene.add(vrm.scene);

      // deal with vrm features
      console.log(vrm);
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
