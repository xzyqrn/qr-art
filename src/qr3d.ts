import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import QRCode from "qrcode";

export type Qr3dOptions = {
  data: string;
  dotsColor: string;
  bgColor: string;
  transparent: boolean;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
};

const MODULE = 1;
const DEPTH = MODULE;
const GAP = 0.06;

export class Qr3dViewer {
  private container: HTMLElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private meshGroup: THREE.Group | null = null;
  private animId = 0;
  private resizeObs: ResizeObserver | null = null;
  private lastKey = "";

  mount(container: HTMLElement): void {
    if (this.container === container && this.renderer) return;
    this.dispose();
    this.container = container;
    container.replaceChildren();

    const width = Math.max(container.clientWidth, 280);
    const height = Math.max(container.clientHeight, 280);

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 500);
    camera.position.set(18, 22, 18);
    camera.lookAt(0, 0, 0);
    this.camera = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(12, 28, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 80;
    key.shadow.camera.left = -30;
    key.shadow.camera.right = 30;
    key.shadow.camera.top = 30;
    key.shadow.camera.bottom = -30;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.28);
    fill.position.set(-14, 10, -8);
    scene.add(fill);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 8;
    controls.maxDistance = 80;
    controls.target.set(0, 0, 0);
    controls.update();
    this.controls = controls;

    this.meshGroup = new THREE.Group();
    scene.add(this.meshGroup);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);

    const tick = () => {
      this.animId = requestAnimationFrame(tick);
      this.controls?.update();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    tick();
  }

  update(options: Qr3dOptions): void {
    if (!this.scene || !this.camera || !this.renderer || !this.meshGroup) {
      throw new Error("3D viewer not mounted");
    }

    const level = options.errorCorrectionLevel ?? "H";
    const key = [
      options.data,
      options.dotsColor,
      options.bgColor,
      options.transparent ? "t" : "o",
      level,
    ].join("|");
    if (key === this.lastKey) return;
    this.lastKey = key;

    const qr = QRCode.create(options.data, { errorCorrectionLevel: level });
    const size = qr.modules.size;
    const cell = MODULE - GAP;
    const half = ((size - 1) * MODULE) / 2;

    this.clearMeshes();

    if (options.transparent) {
      this.scene.background = null;
      this.renderer.setClearColor(0x000000, 0);
    } else {
      const bg = new THREE.Color(options.bgColor);
      this.scene.background = bg;
      this.renderer.setClearColor(bg, 1);

      const groundMat = new THREE.MeshStandardMaterial({
        color: bg,
        roughness: 0.92,
        metalness: 0.02,
      });
      const groundGeo = new THREE.PlaneGeometry(size * MODULE + 4, size * MODULE + 4);
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -DEPTH * 0.02;
      ground.receiveShadow = true;
      this.meshGroup.add(ground);
    }

    const positions: THREE.Vector3[] = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!qr.modules.get(row, col)) continue;
        positions.push(
          new THREE.Vector3(col * MODULE - half, DEPTH / 2, row * MODULE - half),
        );
      }
    }

    if (positions.length === 0) return;

    const geo = new THREE.BoxGeometry(cell, DEPTH, cell);
    const mat = new THREE.MeshStandardMaterial({
      color: options.dotsColor,
      roughness: 0.45,
      metalness: 0.08,
    });
    const instanced = new THREE.InstancedMesh(geo, mat, positions.length);
    instanced.castShadow = true;
    instanced.receiveShadow = true;
    const dummy = new THREE.Object3D();
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    this.meshGroup.add(instanced);

    const span = size * MODULE;
    const dist = span * 1.35;
    this.camera.position.set(dist * 0.85, dist * 0.95, dist * 0.85);
    this.controls!.target.set(0, DEPTH * 0.35, 0);
    this.controls!.update();
  }

  resize(): void {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = Math.max(this.container.clientWidth, 120);
    const height = Math.max(this.container.clientHeight, 120);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  exportPng(filename = "xzyqrn-qr-3d.png"): void {
    if (!this.renderer || !this.scene || !this.camera) {
      throw new Error("3D viewer not ready");
    }
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  dispose(): void {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
    this.resizeObs?.disconnect();
    this.resizeObs = null;
    this.clearMeshes();
    this.controls?.dispose();
    this.controls = null;
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.meshGroup = null;
    this.container = null;
    this.lastKey = "";
  }

  private clearMeshes(): void {
    if (!this.meshGroup) return;
    while (this.meshGroup.children.length > 0) {
      const child = this.meshGroup.children[0];
      this.meshGroup.remove(child);
      disposeObject(child);
    }
  }
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => m.dispose());
    } else if (mat) {
      mat.dispose();
    }
  });
}
