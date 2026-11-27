import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { ColliderBoxSpec, DynamicPropSpec } from '../../types/engine';

export interface DynamicPropBinding {
  spec: DynamicPropSpec;
  body: RAPIER.RigidBody;
  mesh: THREE.Object3D;
}

const FIXED_TIMESTEP = 1 / 60;
const GRAVITY = -22.0;

export class RapierWorld {
  public world!: RAPIER.World;
  public initialized = false;

  private characterController: RAPIER.KinematicCharacterController | null = null;
  private playerBody: RAPIER.RigidBody | null = null;
  private playerCollider: RAPIER.Collider | null = null;
  private dynamicBindings: DynamicPropBinding[] = [];

  private accumulator = 0;
  private playerVelocityY = 0;
  private playerGrounded = false;

  // Reusable scratch objects (zero per-frame allocations)
  private readonly _desiredTranslation = { x: 0, y: 0, z: 0 };
  private readonly _nextPos = { x: 0, y: 0, z: 0 };

  public async init(): Promise<void> {
    if (this.initialized) return;
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0.0, y: GRAVITY, z: 0.0 });
    this.createGroundPlane();
    this.createPlayerController();
    this.initialized = true;
  }

  private createGroundPlane(): void {
    // Large static ground slab (top surface at y = 0)
    const groundBody = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0),
    );
    const groundCollider = RAPIER.ColliderDesc.cuboid(120, 0.5, 120)
      .setFriction(0.85)
      .setRestitution(0.05);
    this.world.createCollider(groundCollider, groundBody);
  }

  private createPlayerController(): void {
    // Grounded kinematic capsule rig (height ~1.5m, bottom at y = 0 when center y = 0.75)
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.85, 18);
    this.playerBody = this.world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.capsule(0.4, 0.35)
      .setFriction(0.0)
      .setRestitution(0.0);
    this.playerCollider = this.world.createCollider(colliderDesc, this.playerBody);

    const controller = this.world.createCharacterController(0.03);
    controller.enableAutostep(0.45, 0.25, true);
    controller.enableSnapToGround(0.35);
    controller.setMaxSlopeClimbAngle((48 * Math.PI) / 180);
    controller.setMinSlopeSlideAngle((35 * Math.PI) / 180);
    controller.setApplyImpulsesToDynamicBodies(true);
    controller.setCharacterMass(65);
    this.characterController = controller;
  }

  public addStaticBoxColliders(specs: ColliderBoxSpec[]): void {
    for (const s of specs) {
      const body = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(s.cx, s.cy, s.cz),
      );
      const collider = RAPIER.ColliderDesc.cuboid(s.hx, s.hy, s.hz)
        .setFriction(0.8)
        .setRestitution(0.08);
      this.world.createCollider(collider, body);
    }
  }

  public addDynamicProp(spec: DynamicPropSpec, mesh: THREE.Object3D): void {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(spec.x, spec.y, spec.z)
      .setLinearDamping(0.35)
      .setAngularDamping(0.6);

    const body = this.world.createRigidBody(bodyDesc);
    const colliderDesc =
      spec.variant === 'barrel'
        ? RAPIER.ColliderDesc.cylinder(spec.hy, spec.hx)
        : RAPIER.ColliderDesc.cuboid(spec.hx, spec.hy, spec.hz);

    colliderDesc.setDensity(spec.mass).setFriction(0.75).setRestitution(0.15);
    this.world.createCollider(colliderDesc, body);

    this.dynamicBindings.push({ spec, body, mesh });
  }

  public resetDynamicProps(): void {
    for (const item of this.dynamicBindings) {
      item.body.setTranslation({ x: item.spec.x, y: item.spec.y, z: item.spec.z }, true);
      item.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      item.mesh.position.set(item.spec.x, item.spec.y, item.spec.z);
      item.mesh.rotation.set(0, 0, 0);
    }
  }

  public resetPlayerSpawn(): void {
    if (!this.playerBody) return;
    this.playerBody.setTranslation({ x: 0, y: 0.85, z: 18 }, true);
    this.playerVelocityY = 0;
    this.playerGrounded = false;
  }

  public step(
    dt: number,
    moveWorldX: number,
    moveWorldZ: number,
    jumpPressed: boolean,
  ): void {
    if (!this.initialized) return;

    this.accumulator += dt;
    let substeps = 0;
    while (this.accumulator >= FIXED_TIMESTEP && substeps < 4) {
      this.stepCharacter(FIXED_TIMESTEP, moveWorldX, moveWorldZ, jumpPressed);
      this.world.step();
      this.accumulator -= FIXED_TIMESTEP;
      substeps++;
    }

    // Sync dynamic physics meshes to Three.js transforms
    for (let i = 0; i < this.dynamicBindings.length; i++) {
      const binding = this.dynamicBindings[i];
      const pos = binding.body.translation();
      const rot = binding.body.rotation();
      binding.mesh.position.set(pos.x, pos.y, pos.z);
      binding.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    }
  }

  private stepCharacter(
    fixedDt: number,
    moveWorldX: number,
    moveWorldZ: number,
    jumpPressed: boolean,
  ): void {
    if (!this.characterController || !this.playerBody || !this.playerCollider) return;

    if (this.playerGrounded && jumpPressed) {
      this.playerVelocityY = 8.4;
      this.playerGrounded = false;
    } else if (this.playerGrounded && this.playerVelocityY < 0) {
      this.playerVelocityY = -0.5;
    } else {
      this.playerVelocityY = Math.max(-28, this.playerVelocityY + GRAVITY * fixedDt);
    }

    this._desiredTranslation.x = moveWorldX * fixedDt;
    this._desiredTranslation.y = this.playerVelocityY * fixedDt;
    this._desiredTranslation.z = moveWorldZ * fixedDt;

    this.characterController.computeColliderMovement(
      this.playerCollider,
      this._desiredTranslation,
    );

    const corrected = this.characterController.computedMovement();
    this.playerGrounded = this.characterController.computedGrounded();

    const current = this.playerBody.translation();
    this._nextPos.x = Math.min(46, Math.max(-46, current.x + corrected.x));
    this._nextPos.y = Math.max(0.75, current.y + corrected.y);
    this._nextPos.z = Math.min(46, Math.max(-46, current.z + corrected.z));

    this.playerBody.setNextKinematicTranslation(this._nextPos);
  }

  public getPlayerPosition(out: THREE.Vector3): THREE.Vector3 {
    if (!this.playerBody) {
      return out.set(0, 0.85, 18);
    }
    const p = this.playerBody.translation();
    return out.set(p.x, p.y, p.z);
  }

  public isPlayerGrounded(): boolean {
    return this.playerGrounded;
  }

  public getStats(): { rigidBodies: number; colliders: number } {
    if (!this.initialized) return { rigidBodies: 0, colliders: 0 };
    return {
      rigidBodies: this.world.bodies.len(),
      colliders: this.world.colliders.len(),
    };
  }

  public dispose(): void {
    if (this.characterController && this.world) {
      this.world.removeCharacterController(this.characterController);
      this.characterController = null;
    }
    if (this.world) {
      this.world.free();
    }
    this.dynamicBindings = [];
    this.playerBody = null;
    this.playerCollider = null;
    this.initialized = false;
  }
}
