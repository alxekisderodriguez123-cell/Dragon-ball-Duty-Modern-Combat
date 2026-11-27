import * as THREE from 'three';
import { GraphicsConfig } from '../../types/engine';

export const SKY_HORIZON_HEX = 0xb5d3eb;

export class LightingRig {
  public readonly sunLight: THREE.DirectionalLight;
  public readonly fillLight: THREE.DirectionalLight;
  public readonly hemiLight: THREE.HemisphereLight;
  private readonly fog: THREE.Fog;

  constructor(private readonly scene: THREE.Scene) {
    this.scene.background = new THREE.Color(SKY_HORIZON_HEX);
    this.fog = new THREE.Fog(SKY_HORIZON_HEX, 55, 165);
    this.scene.fog = this.fog;

    // Cool sky / warm earth hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x9fd3ff, 0x9b7e57, 0.95);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Warm afternoon sunlit key light (single shadow caster for mid-range mobile speed)
    this.sunLight = new THREE.DirectionalLight(0xfff0d4, 2.35);
    this.sunLight.position.set(42, 58, 34);
    this.sunLight.target.position.set(0, 0, 0);
    this.scene.add(this.sunLight.target);

    const d = 52;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.03;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.sunLight);

    // Cool opposite rim/fill light (no shadow)
    this.fillLight = new THREE.DirectionalLight(0x9bc4ff, 0.55);
    this.fillLight.position.set(-36, 24, -32);
    this.scene.add(this.fillLight);
  }

  public applyGraphicsConfig(
    config: GraphicsConfig,
    shadowMapSize: number,
    isSoftwareGl: boolean,
  ): void {
    const allowShadows = config.shadows && !isSoftwareGl;
    this.sunLight.castShadow = allowShadows;

    if (
      this.sunLight.shadow.mapSize.width !== shadowMapSize ||
      this.sunLight.shadow.mapSize.height !== shadowMapSize
    ) {
      this.sunLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        this.sunLight.shadow.map = null;
      }
    }

    if (config.effects) {
      this.fog.near = Math.max(30, config.viewDistance * 0.35);
      this.fog.far = config.viewDistance;
      this.scene.fog = this.fog;
    } else {
      this.scene.fog = null;
    }
  }

  public dispose(): void {
    if (this.sunLight.shadow.map) {
      this.sunLight.shadow.map.dispose();
    }
    this.scene.remove(this.sunLight, this.sunLight.target, this.fillLight, this.hemiLight);
  }
}
