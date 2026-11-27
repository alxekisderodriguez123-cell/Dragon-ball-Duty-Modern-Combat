import * as THREE from 'three';
import { CameraMode } from '../../types/engine';
import { InputSnapshot } from '../input/InputManager';

const _targetPos = new THREE.Vector3();
const _lookAtPos = new THREE.Vector3();

export class CameraRig {
  public readonly camera: THREE.PerspectiveCamera;
  private mode: CameraMode = 'overview';

  private yaw = 0;
  private pitch = 0.08;

  private orbitYaw = 0.48;
  private orbitPitch = 0.36;
  private orbitRadius = 36;
  private autoOrbit = true;

  private readonly currentCamPos = new THREE.Vector3(16, 14, 32);
  private readonly currentLookAt = new THREE.Vector3(0, 2, -6);

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.15, 320);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public setMode(mode: CameraMode): void {
    this.mode = mode;
    if (mode === 'overview') {
      this.autoOrbit = true;
      this.camera.fov = 54;
    } else if (mode === 'fps') {
      this.camera.fov = 72;
    } else {
      this.camera.fov = 65;
    }
    this.camera.updateProjectionMatrix();
  }

  public getMode(): CameraMode {
    return this.mode;
  }

  public setAutoOrbit(enabled: boolean): void {
    this.autoOrbit = enabled;
  }

  public setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public setFarPlane(far: number): void {
    this.camera.far = Math.max(120, far + 80);
    this.camera.updateProjectionMatrix();
  }

  public getYaw(): number {
    return this.yaw;
  }

  public update(
    dt: number,
    input: InputSnapshot,
    playerPos: THREE.Vector3,
    tpsProxy: THREE.Object3D,
    isExploring: boolean,
  ): void {
    const sensitivity = 0.0042;

    if (this.mode === 'overview') {
      tpsProxy.visible = false;
      if (Math.abs(input.lookDeltaX) > 0.1 || Math.abs(input.lookDeltaY) > 0.1) {
        this.autoOrbit = false;
        this.orbitYaw -= input.lookDeltaX * sensitivity;
        this.orbitPitch = THREE.MathUtils.clamp(
          this.orbitPitch + input.lookDeltaY * sensitivity,
          0.12,
          1.15,
        );
      } else if (this.autoOrbit || !isExploring) {
        this.orbitYaw += dt * 0.14;
      }

      if (Math.abs(input.zoomDelta) > 0.001) {
        this.orbitRadius = THREE.MathUtils.clamp(
          this.orbitRadius + input.zoomDelta * 2.4,
          14,
          62,
        );
      }

      const horiz = Math.cos(this.orbitPitch) * this.orbitRadius;
      _targetPos.set(
        Math.sin(this.orbitYaw) * horiz,
        Math.sin(this.orbitPitch) * this.orbitRadius + 2.0,
        Math.cos(this.orbitYaw) * horiz - 2.0,
      );
      _lookAtPos.set(0, 2.2, -5.0);

      const dampLambda = 6.5;
      this.currentCamPos.x = THREE.MathUtils.damp(this.currentCamPos.x, _targetPos.x, dampLambda, dt);
      this.currentCamPos.y = THREE.MathUtils.damp(this.currentCamPos.y, _targetPos.y, dampLambda, dt);
      this.currentCamPos.z = THREE.MathUtils.damp(this.currentCamPos.z, _targetPos.z, dampLambda, dt);

      this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, _lookAtPos.x, dampLambda, dt);
      this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, _lookAtPos.y, dampLambda, dt);
      this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, _lookAtPos.z, dampLambda, dt);

      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    // FPS & TPS shared yaw/pitch look
    this.yaw -= input.lookDeltaX * sensitivity;
    this.pitch = THREE.MathUtils.clamp(
      this.pitch - input.lookDeltaY * sensitivity,
      -1.28,
      1.28,
    );

    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    if (this.mode === 'fps') {
      tpsProxy.visible = false;
      _targetPos.set(playerPos.x, playerPos.y + 0.56, playerPos.z);
      _lookAtPos.set(
        _targetPos.x + forwardX * Math.cos(this.pitch) * 10,
        _targetPos.y + Math.sin(this.pitch) * 10,
        _targetPos.z + forwardZ * Math.cos(this.pitch) * 10,
      );

      this.currentCamPos.copy(_targetPos);
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(_lookAtPos);
      this.currentLookAt.copy(_lookAtPos);
    } else {
      // TPS over-the-shoulder test camera
      tpsProxy.visible = true;
      tpsProxy.position.set(playerPos.x, playerPos.y - 0.75, playerPos.z);
      tpsProxy.rotation.y = this.yaw;

      const dist = 3.8;
      const shoulderOffset = 0.72;
      const pivotY = playerPos.y + 0.68;

      _targetPos.set(
        playerPos.x - forwardX * Math.cos(this.pitch) * dist + rightX * shoulderOffset,
        pivotY - Math.sin(this.pitch) * dist * 0.75 + 0.45,
        playerPos.z - forwardZ * Math.cos(this.pitch) * dist + rightZ * shoulderOffset,
      );
      _targetPos.y = Math.max(0.45, _targetPos.y);

      _lookAtPos.set(
        playerPos.x + forwardX * 8 + rightX * 0.35,
        pivotY + Math.sin(this.pitch) * 5,
        playerPos.z + forwardZ * 8 + rightZ * 0.35,
      );

      const dampLambda = 16;
      this.currentCamPos.x = THREE.MathUtils.damp(this.currentCamPos.x, _targetPos.x, dampLambda, dt);
      this.currentCamPos.y = THREE.MathUtils.damp(this.currentCamPos.y, _targetPos.y, dampLambda, dt);
      this.currentCamPos.z = THREE.MathUtils.damp(this.currentCamPos.z, _targetPos.z, dampLambda, dt);

      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(_lookAtPos);
      this.currentLookAt.copy(_lookAtPos);
    }
  }
}
