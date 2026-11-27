import * as THREE from 'three';
import { ColliderBoxSpec, DynamicPropSpec } from '../../types/engine';
import { ProceduralTextureSet } from '../graphics/ProceduralTextures';
import { RapierWorld } from '../physics/RapierWorld';

export interface BuiltTrainingBase {
  root: THREE.Group;
  radarDish: THREE.Object3D;
  tpsProxy: THREE.Group;
  update: (dt: number, elapsed: number) => void;
}

function addShadowFlags(obj: THREE.Object3D, cast = true, receive = true): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function createExtrudedBarrierGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.42, 0);
  shape.lineTo(0.42, 0);
  shape.lineTo(0.36, 0.25);
  shape.lineTo(0.18, 0.95);
  shape.lineTo(-0.18, 0.95);
  shape.lineTo(-0.36, 0.25);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 2.8,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -1.4);
  geo.computeVertexNormals();
  return geo;
}

export function buildTrainingBase(
  textures: ProceduralTextureSet,
  rapier: RapierWorld,
): BuiltTrainingBase {
  const root = new THREE.Group();
  root.name = 'TrainingBaseRoot';

  const staticColliders: ColliderBoxSpec[] = [];

  // Shared materials (reused across groups to keep draw calls & GPU state switches low)
  const matAsphalt = new THREE.MeshStandardMaterial({
    map: textures.groundAsphalt,
    roughness: 0.9,
    metalness: 0.04,
  });
  const matDesert = new THREE.MeshStandardMaterial({
    map: textures.desertTerrain,
    roughness: 0.96,
    metalness: 0.0,
  });
  const matConcrete = new THREE.MeshStandardMaterial({
    map: textures.concreteWall,
    roughness: 0.85,
    metalness: 0.05,
  });
  const matDarkSteel = new THREE.MeshStandardMaterial({
    color: 0x2a3441,
    roughness: 0.42,
    metalness: 0.78,
  });
  const matAccentSteel = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.35,
    metalness: 0.72,
  });
  const matRoofMetal = new THREE.MeshStandardMaterial({
    color: 0x3b4d63,
    roughness: 0.48,
    metalness: 0.65,
  });
  const matDome = new THREE.MeshStandardMaterial({
    map: textures.domeArmor,
    roughness: 0.42,
    metalness: 0.35,
  });
  const matHazard = new THREE.MeshStandardMaterial({
    map: textures.hazardStripe,
    roughness: 0.65,
    metalness: 0.12,
  });
  const matWoodCrate = new THREE.MeshStandardMaterial({
    map: textures.woodCrate,
    roughness: 0.84,
    metalness: 0.04,
  });
  const matBarrier = new THREE.MeshStandardMaterial({
    color: 0xaba393,
    roughness: 0.88,
    metalness: 0.04,
  });
  const matSandbag = new THREE.MeshStandardMaterial({
    color: 0xb69c6d,
    roughness: 0.95,
    metalness: 0.0,
  });
  const matGlassVisor = new THREE.MeshPhysicalMaterial({
    color: 0x1e3a5f,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.8,
  });
  const matGoldTrim = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.32,
    metalness: 0.7,
  });
  const matContactShadow = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  // 1. Ground & Extended Natural Perimeter
  const outerTerrain = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), matDesert);
  outerTerrain.rotation.x = -Math.PI / 2;
  outerTerrain.position.y = -0.04;
  outerTerrain.receiveShadow = true;
  root.add(outerTerrain);

  const courtyard = new THREE.Mesh(new THREE.PlaneGeometry(96, 96), matAsphalt);
  courtyard.rotation.x = -Math.PI / 2;
  courtyard.position.y = 0;
  courtyard.receiveShadow = true;
  root.add(courtyard);

  // Central tactical marking pad (slightly raised to avoid z-fighting)
  const centerPad = new THREE.Group();
  const padBase = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 8.8, 0.08, 32),
    matConcrete,
  );
  padBase.position.y = 0.04;
  padBase.receiveShadow = true;
  const padRing = new THREE.Mesh(
    new THREE.RingGeometry(6.6, 7.2, 32),
    new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.65,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.y = 0.09;
  centerPad.add(padBase, padRing);
  root.add(centerPad);

  // 2. Command HQ Dome (North Backdrop Hero Structure, 8 parts)
  const hqGroup = new THREE.Group();
  hqGroup.position.set(0, 0, -32);

  const hqPlinth = new THREE.Mesh(new THREE.BoxGeometry(22, 1.4, 18), matConcrete);
  hqPlinth.position.y = 0.7;
  hqGroup.add(hqPlinth);

  const hqTrim = new THREE.Mesh(new THREE.BoxGeometry(22.2, 0.35, 18.2), matHazard);
  hqTrim.position.y = 1.5;
  hqGroup.add(hqTrim);

  const domeShell = new THREE.Mesh(
    new THREE.SphereGeometry(8.8, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    matDome,
  );
  domeShell.position.y = 1.4;
  hqGroup.add(domeShell);

  const hqGateFrame = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.2, 2.2), matDarkSteel);
  hqGateFrame.position.set(0, 2.8, 8.2);
  hqGroup.add(hqGateFrame);

  const hqGateDoor = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 0.4), matAccentSteel);
  hqGateDoor.position.set(0, 2.4, 9.2);
  hqGroup.add(hqGateDoor);

  // Side cooling towers on HQ
  for (const sx of [-7.5, 7.5]) {
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 4.2, 12), matAccentSteel);
    vent.position.set(sx, 3.5, 5.2);
    hqGroup.add(vent);
  }

  // Rooftop comms mast + rotating radar dish
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 4.2, 10), matDarkSteel);
  mast.position.set(0, 11.4, 0);
  hqGroup.add(mast);

  const radarDish = new THREE.Group();
  radarDish.position.set(0, 13.5, 0);
  const dishCup = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.38),
    matDome,
  );
  dishCup.rotation.x = Math.PI * 0.35;
  const dishFeed = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 8), matGoldTrim);
  dishFeed.rotation.x = Math.PI * 0.35;
  dishFeed.position.set(0, 0.3, 0.7);
  radarDish.add(dishCup, dishFeed);
  hqGroup.add(radarDish);

  addShadowFlags(hqGroup, true, true);
  root.add(hqGroup);

  staticColliders.push({
    id: 'hq-dome-base',
    cx: 0,
    cy: 5.0,
    cz: -32,
    hx: 11.1,
    hy: 5.0,
    hz: 9.2,
  });

  // 3. Tactical Watchtowers (Left & Right North Flanks, 7 parts each)
  const buildWatchtower = (x: number, z: number, id: string) => {
    const tower = new THREE.Group();
    tower.position.set(x, 0, z);

    const legGeo = new THREE.BoxGeometry(0.45, 7.5, 0.45);
    for (const lx of [-2.1, 2.1]) {
      for (const lz of [-2.1, 2.1]) {
        const leg = new THREE.Mesh(legGeo, matDarkSteel);
        leg.position.set(lx, 3.75, lz);
        tower.add(leg);
      }
    }

    const deck = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.45, 5.6), matConcrete);
    deck.position.y = 7.5;
    tower.add(deck);

    const parapet = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.1, 5.4), matAccentSteel);
    parapet.position.y = 8.25;
    tower.add(parapet);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.3, 4.2), matGlassVisor);
    cabin.position.y = 9.7;
    tower.add(cabin);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.4, 4), matRoofMetal);
    roof.position.y = 11.55;
    roof.rotation.y = Math.PI / 4;
    tower.add(roof);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 3.2, 6), matGoldTrim);
    antenna.position.set(0.8, 13.0, 0);
    tower.add(antenna);

    addShadowFlags(tower, true, true);
    root.add(tower);

    staticColliders.push({
      id,
      cx: x,
      cy: 4.5,
      cz: z,
      hx: 2.7,
      hy: 4.5,
      hz: 2.7,
    });
  };

  buildWatchtower(-26, -24, 'watchtower-west');
  buildWatchtower(26, -24, 'watchtower-east');

  // 4. Modular Military Barracks / Bunkers (6 parts each)
  const buildBarracks = (x: number, z: number, rotY: number, id: string) => {
    const b = new THREE.Group();
    b.position.set(x, 0, z);
    b.rotation.y = rotY;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.5, 16.6), matDarkSteel);
    plinth.position.y = 0.25;
    b.add(plinth);

    const body = new THREE.Mesh(new THREE.BoxGeometry(11, 5.2, 16), matConcrete);
    body.position.y = 3.1;
    b.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.7, 16.8), matRoofMetal);
    roof.position.y = 6.0;
    b.add(roof);

    // Armored window slits & doorway
    const windowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 10.5), matGlassVisor);
    windowStrip.position.set(5.45, 3.8, 0);
    b.add(windowStrip);

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 2.6), matDarkSteel);
    doorFrame.position.set(5.45, 2.1, -5.2);
    b.add(doorFrame);

    // Roof HVAC units
    for (const hz of [-4.5, 4.5]) {
      const hvac = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 2.8), matAccentSteel);
      hvac.position.set(-1.5, 6.9, hz);
      b.add(hvac);
    }

    addShadowFlags(b, true, true);
    root.add(b);

    // Approximate axis-aligned collider (rotY is 0 or Math.PI)
    staticColliders.push({
      id,
      cx: x,
      cy: 3.2,
      cz: z,
      hx: 5.8,
      hy: 3.2,
      hz: 8.3,
    });
  };

  buildBarracks(-31, 4, 0, 'barracks-west');
  buildBarracks(31, 4, Math.PI, 'barracks-east');

  // 5. Stylized Shipping Containers (4-part composite groups)
  const containerSpecs: Array<{
    x: number;
    y: number;
    z: number;
    rotY: number;
    tex: THREE.CanvasTexture;
    id: string;
  }> = [
    { x: -15, y: 0, z: -10, rotY: 0, tex: textures.containerTan, id: 'cont-1' },
    { x: -15, y: 2.9, z: -10, rotY: 0.04, tex: textures.containerOlive, id: 'cont-1-top' },
    { x: 16, y: 0, z: -11, rotY: Math.PI / 2, tex: textures.containerNavy, id: 'cont-2' },
    { x: -16, y: 0, z: 14, rotY: Math.PI / 2, tex: textures.containerNavy, id: 'cont-3' },
    { x: 17, y: 0, z: 13, rotY: 0.15, tex: textures.containerTan, id: 'cont-4' },
    { x: 0, y: 0, z: -14, rotY: Math.PI / 2, tex: textures.containerOlive, id: 'cont-5' },
  ];

  const containerMaterials = new Map<THREE.CanvasTexture, THREE.MeshStandardMaterial>();
  for (const spec of containerSpecs) {
    let bodyMat = containerMaterials.get(spec.tex);
    if (!bodyMat) {
      bodyMat = new THREE.MeshStandardMaterial({
        map: spec.tex,
        roughness: 0.62,
        metalness: 0.35,
      });
      containerMaterials.set(spec.tex, bodyMat);
    }

    const cGroup = new THREE.Group();
    cGroup.position.set(spec.x, spec.y, spec.z);
    cGroup.rotation.y = spec.rotY;

    const shell = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 6.2), bodyMat);
    shell.position.y = 1.45;
    cGroup.add(shell);

    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.16, 6.32), matDarkSteel);
    topFrame.position.y = 2.85;
    cGroup.add(topFrame);

    const botFrame = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.16, 6.32), matDarkSteel);
    botFrame.position.y = 0.08;
    cGroup.add(botFrame);

    if (spec.y === 0) {
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 7.6), matContactShadow);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.015;
      cGroup.add(shadow);
    }

    addShadowFlags(cGroup, true, true);
    root.add(cGroup);

    const isRotated90 = Math.abs(Math.sin(spec.rotY)) > 0.7;
    staticColliders.push({
      id: spec.id,
      cx: spec.x,
      cy: spec.y + 1.45,
      cz: spec.z,
      hx: isRotated90 ? 3.15 : 1.38,
      hy: 1.45,
      hz: isRotated90 ? 1.38 : 3.15,
    });
  }

  // 6. Instanced Concrete Jersey Barriers (ExtrudeGeometry + Rapier Colliders)
  const barrierPositions: Array<{ x: number; z: number; rotY: number }> = [
    { x: -7.5, z: 6.5, rotY: 0.3 },
    { x: 7.5, z: 6.5, rotY: -0.3 },
    { x: -7.5, z: -5.5, rotY: -0.25 },
    { x: 7.5, z: -5.5, rotY: 0.25 },
    { x: -21, z: 0, rotY: Math.PI / 2 },
    { x: 21, z: 0, rotY: Math.PI / 2 },
    { x: -11, z: 24, rotY: Math.PI / 2 },
    { x: 11, z: 24, rotY: Math.PI / 2 },
    { x: -24, z: 26, rotY: 0.45 },
    { x: 24, z: 26, rotY: -0.45 },
  ];

  const barrierGeo = createExtrudedBarrierGeometry();
  const barrierInst = new THREE.InstancedMesh(barrierGeo, matBarrier, barrierPositions.length);
  barrierInst.castShadow = true;
  barrierInst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  barrierPositions.forEach((b, idx) => {
    dummy.position.set(b.x, 0, b.z);
    dummy.rotation.set(0, b.rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    barrierInst.setMatrixAt(idx, dummy.matrix);

    const isWideX = Math.abs(Math.sin(b.rotY)) > 0.7;
    staticColliders.push({
      id: `barrier-${idx}`,
      cx: b.x,
      cy: 0.48,
      cz: b.z,
      hx: isWideX ? 1.42 : 0.45,
      hy: 0.48,
      hz: isWideX ? 0.45 : 1.42,
    });
  });
  barrierInst.instanceMatrix.needsUpdate = true;
  barrierInst.computeBoundingSphere();
  root.add(barrierInst);

  // 7. Instanced Static Wooden Supply Crates (clusters around cover lanes)
  const staticCrateSpecs: Array<{ x: number; y: number; z: number; scale: number; rotY: number }> = [
    { x: -12.5, y: 0.65, z: -7.2, scale: 1.3, rotY: 0.2 },
    { x: -11.1, y: 0.65, z: -7.5, scale: 1.3, rotY: -0.1 },
    { x: -11.8, y: 1.95, z: -7.35, scale: 1.25, rotY: 0.4 },
    { x: 12.8, y: 0.65, z: -7.8, scale: 1.3, rotY: -0.2 },
    { x: 13.6, y: 0.65, z: -6.3, scale: 1.3, rotY: 0.35 },
    { x: -13.2, y: 0.65, z: 10.2, scale: 1.3, rotY: 0.1 },
    { x: 13.0, y: 0.65, z: 9.8, scale: 1.3, rotY: -0.3 },
    { x: 13.8, y: 0.65, z: 11.2, scale: 1.3, rotY: 0.15 },
    { x: 13.4, y: 1.95, z: 10.5, scale: 1.22, rotY: -0.15 },
    { x: -4.8, y: 0.6, z: -18.5, scale: 1.2, rotY: 0 },
    { x: 4.8, y: 0.6, z: -18.5, scale: 1.2, rotY: 0.2 },
  ];

  const staticCrateGeo = new THREE.BoxGeometry(1, 1, 1);
  const staticCrateInst = new THREE.InstancedMesh(
    staticCrateGeo,
    matWoodCrate,
    staticCrateSpecs.length,
  );
  staticCrateInst.castShadow = true;
  staticCrateInst.receiveShadow = true;

  staticCrateSpecs.forEach((c, idx) => {
    dummy.position.set(c.x, c.y, c.z);
    dummy.rotation.set(0, c.rotY, 0);
    dummy.scale.setScalar(c.scale);
    dummy.updateMatrix();
    staticCrateInst.setMatrixAt(idx, dummy.matrix);

    const h = c.scale * 0.5;
    staticColliders.push({
      id: `static-crate-${idx}`,
      cx: c.x,
      cy: c.y,
      cz: c.z,
      hx: h,
      hy: h,
      hz: h,
    });
  });
  staticCrateInst.instanceMatrix.needsUpdate = true;
  staticCrateInst.computeBoundingSphere();
  root.add(staticCrateInst);

  // 8. Instanced Sandbag Defensive Walls
  const sandbagGeo = new THREE.BoxGeometry(0.9, 0.38, 0.48);
  const sandbagAnchors = [
    { x: -4.2, z: 11.5, rotY: 0 },
    { x: 4.2, z: 11.5, rotY: 0 },
    { x: 0, z: -21.5, rotY: 0 },
    { x: -20, z: -16, rotY: 0.6 },
    { x: 20, z: -16, rotY: -0.6 },
  ];
  const sandbagCount = sandbagAnchors.length * 6;
  const sandbagInst = new THREE.InstancedMesh(sandbagGeo, matSandbag, sandbagCount);
  sandbagInst.castShadow = true;
  sandbagInst.receiveShadow = true;

  const tintColor = new THREE.Color();
  let sbIdx = 0;
  sandbagAnchors.forEach((anchor, aIdx) => {
    for (let row = 0; row < 2; row++) {
      for (let col = -1; col <= 1; col++) {
        const localX = col * 0.92 + (row === 1 ? 0.15 : 0);
        const cos = Math.cos(anchor.rotY);
        const sin = Math.sin(anchor.rotY);
        dummy.position.set(
          anchor.x + localX * cos,
          0.19 + row * 0.36,
          anchor.z - localX * sin,
        );
        dummy.rotation.set(0, anchor.rotY, 0);
        dummy.scale.set(1 + ((sbIdx % 3) - 1) * 0.06, 1, 1);
        dummy.updateMatrix();
        sandbagInst.setMatrixAt(sbIdx, dummy.matrix);
        tintColor.setHex(0xb69c6d).offsetHSL(0, 0, ((sbIdx % 5) - 2) * 0.025);
        sandbagInst.setColorAt(sbIdx, tintColor);
        sbIdx++;
      }
    }
    staticColliders.push({
      id: `sandbag-wall-${aIdx}`,
      cx: anchor.x,
      cy: 0.38,
      cz: anchor.z,
      hx: 1.4,
      hy: 0.38,
      hz: 0.35,
    });
  });
  sandbagInst.instanceMatrix.needsUpdate = true;
  if (sandbagInst.instanceColor) sandbagInst.instanceColor.needsUpdate = true;
  sandbagInst.computeBoundingSphere();
  root.add(sandbagInst);

  // 9. Instanced Perimeter Steel Fence Posts + Arena Boundary Walls
  const postPositions: Array<{ x: number; z: number }> = [];
  const halfArena = 46.5;
  for (let p = -44; p <= 44; p += 4) {
    postPositions.push({ x: p, z: -halfArena });
    postPositions.push({ x: p, z: halfArena });
    postPositions.push({ x: -halfArena, z: p });
    postPositions.push({ x: halfArena, z: p });
  }
  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.1, 6);
  const postInst = new THREE.InstancedMesh(postGeo, matDarkSteel, postPositions.length);
  postInst.castShadow = true;
  postPositions.forEach((p, idx) => {
    dummy.position.set(p.x, 1.55, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    postInst.setMatrixAt(idx, dummy.matrix);
  });
  postInst.instanceMatrix.needsUpdate = true;
  postInst.computeBoundingSphere();
  root.add(postInst);

  // Perimeter curb & horizontal guard rails (4 merged long beams)
  const railH = new THREE.BoxGeometry(93, 0.14, 0.12);
  const railV = new THREE.BoxGeometry(0.12, 0.14, 93);
  for (const ry of [1.2, 2.4]) {
    const north = new THREE.Mesh(railH, matAccentSteel);
    north.position.set(0, ry, -halfArena);
    const south = new THREE.Mesh(railH, matAccentSteel);
    south.position.set(0, ry, halfArena);
    const west = new THREE.Mesh(railV, matAccentSteel);
    west.position.set(-halfArena, ry, 0);
    const east = new THREE.Mesh(railV, matAccentSteel);
    east.position.set(halfArena, ry, 0);
    root.add(north, south, west, east);
  }

  // Outer perimeter invisible Rapier boundary colliders
  staticColliders.push(
    { id: 'bound-n', cx: 0, cy: 3, cz: -47.2, hx: 48, hy: 3, hz: 0.8 },
    { id: 'bound-s', cx: 0, cy: 3, cz: 47.2, hx: 48, hy: 3, hz: 0.8 },
    { id: 'bound-w', cx: -47.2, cy: 3, cz: 0, hx: 0.8, hy: 3, hz: 48 },
    { id: 'bound-e', cx: 47.2, cy: 3, cz: 0, hx: 0.8, hy: 3, hz: 48 },
  );

  // 10. Instanced Distant Desert Canyon Mesas & Rock Outcrops (Horizon depth)
  const mesaGeo = new THREE.CylinderGeometry(7, 13, 18, 7);
  const mesaMat = new THREE.MeshStandardMaterial({
    color: 0xb98552,
    roughness: 0.94,
    metalness: 0.0,
    flatShading: true,
  });
  const mesaCount = 26;
  const mesaInst = new THREE.InstancedMesh(mesaGeo, mesaMat, mesaCount);
  for (let i = 0; i < mesaCount; i++) {
    const angle = (i / mesaCount) * Math.PI * 2;
    const radius = 86 + (i % 4) * 18;
    const scaleY = 0.7 + ((i * 7) % 10) * 0.14;
    const scaleXZ = 0.85 + ((i * 5) % 8) * 0.18;
    dummy.position.set(
      Math.cos(angle) * radius,
      9 * scaleY - 0.5,
      Math.sin(angle) * radius,
    );
    dummy.rotation.set(0, angle * 1.7, 0);
    dummy.scale.set(scaleXZ, scaleY, scaleXZ * 0.85);
    dummy.updateMatrix();
    mesaInst.setMatrixAt(i, dummy.matrix);
    tintColor.setHex(0xb98552).offsetHSL(0, 0, ((i % 5) - 2) * 0.03);
    mesaInst.setColorAt(i, tintColor);
  }
  mesaInst.instanceMatrix.needsUpdate = true;
  if (mesaInst.instanceColor) mesaInst.instanceColor.needsUpdate = true;
  mesaInst.computeBoundingSphere();
  root.add(mesaInst);

  // Register all static colliders in Rapier
  rapier.addStaticBoxColliders(staticColliders);

  // 11. Dynamic Rapier Physics Test Props (Pushable Crates & Tactical Barrels)
  const dynamicSpecs: DynamicPropSpec[] = [
    { id: 'dyn-crate-1', x: -2.4, y: 1.5, z: 3.2, hx: 0.52, hy: 0.52, hz: 0.52, mass: 1.2, variant: 'crate' },
    { id: 'dyn-crate-2', x: -1.1, y: 1.5, z: 3.4, hx: 0.52, hy: 0.52, hz: 0.52, mass: 1.2, variant: 'crate' },
    { id: 'dyn-crate-3', x: -1.75, y: 2.8, z: 3.3, hx: 0.52, hy: 0.52, hz: 0.52, mass: 1.1, variant: 'crate' },
    { id: 'dyn-barrel-1', x: 2.6, y: 1.6, z: 2.8, hx: 0.42, hy: 0.6, hz: 0.42, mass: 1.4, variant: 'barrel' },
    { id: 'dyn-barrel-2', x: 3.6, y: 1.6, z: 3.5, hx: 0.42, hy: 0.6, hz: 0.42, mass: 1.4, variant: 'barrel' },
  ];

  const dynCrateGeo = new THREE.BoxGeometry(1.04, 1.04, 1.04);
  const dynBarrelGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.2, 14);
  const matBarrel = new THREE.MeshStandardMaterial({
    color: 0x3b6e52,
    roughness: 0.45,
    metalness: 0.55,
  });

  for (const dSpec of dynamicSpecs) {
    let mesh: THREE.Mesh;
    if (dSpec.variant === 'barrel') {
      mesh = new THREE.Mesh(dynBarrelGeo, matBarrel);
    } else {
      mesh = new THREE.Mesh(dynCrateGeo, matWoodCrate);
    }
    mesh.position.set(dSpec.x, dSpec.y, dSpec.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    rapier.addDynamicProp(dSpec, mesh);
  }

  // 12. Minimal Geometric TPS Test Rig (only shown in TPS test mode; NOT a final character)
  const tpsProxy = new THREE.Group();
  tpsProxy.visible = false;

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.48, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x26344a, roughness: 0.65, metalness: 0.2 }),
  );
  torso.position.y = 0.72;

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.16, 0.24),
    matGoldTrim,
  );
  visor.position.set(0, 1.05, -0.22);

  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.44, 0.22),
    matDarkSteel,
  );
  pack.position.set(0, 0.76, 0.28);

  const proxyShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), matContactShadow);
  proxyShadow.rotation.x = -Math.PI / 2;
  proxyShadow.position.y = 0.02;

  tpsProxy.add(torso, visor, pack, proxyShadow);
  addShadowFlags(tpsProxy, true, false);
  tpsProxy.remove(proxyShadow);
  tpsProxy.add(proxyShadow);
  root.add(tpsProxy);

  return {
    root,
    radarDish,
    tpsProxy,
    update: (dt: number) => {
      radarDish.rotation.y += dt * 0.65;
    },
  };
}
