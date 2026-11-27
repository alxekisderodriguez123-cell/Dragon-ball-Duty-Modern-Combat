import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject3D } from '../graphics/WebGLUtils';

/**
 * Standard GLB/GLTF asset pipeline foundation for Phase 02+ characters, weapons, and props.
 * Keeps resource caching, shadow configuration, and GPU disposal decoupled from React.
 */
export class ModelLoader {
  public readonly loadingManager: THREE.LoadingManager;
  private readonly gltfLoader: GLTFLoader;
  private readonly cache = new Map<string, GLTF>();

  constructor(onProgress?: (url: string, loaded: number, total: number) => void) {
    this.loadingManager = new THREE.LoadingManager();
    if (onProgress) {
      this.loadingManager.onProgress = onProgress;
    }
    this.gltfLoader = new GLTFLoader(this.loadingManager);
  }

  public async loadGLB(key: string, url: string): Promise<THREE.Group> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached.scene.clone(true);
    }

    const gltf = await new Promise<GLTF>((resolve, reject) => {
      this.gltfLoader.load(url, resolve, undefined, reject);
    });

    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.cache.set(key, gltf);
    return gltf.scene.clone(true);
  }

  public hasCached(key: string): boolean {
    return this.cache.has(key);
  }

  public dispose(): void {
    this.cache.forEach((gltf) => {
      disposeObject3D(gltf.scene);
    });
    this.cache.clear();
  }
}
