import * as THREE from 'three';

export interface ProceduralTextureSet {
  groundAsphalt: THREE.CanvasTexture;
  desertTerrain: THREE.CanvasTexture;
  containerTan: THREE.CanvasTexture;
  containerNavy: THREE.CanvasTexture;
  containerOlive: THREE.CanvasTexture;
  concreteWall: THREE.CanvasTexture;
  woodCrate: THREE.CanvasTexture;
  domeArmor: THREE.CanvasTexture;
  hazardStripe: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const aniso = Math.min(Math.max(1, maxAnisotropy), 8);

  // 1. Courtyard concrete/asphalt with tactical seams & subtle grit
  const [gCanvas, gCtx] = makeCanvas(512, 512);
  gCtx.fillStyle = '#8b8378';
  gCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4200; i++) {
    const x = (i * 73) % 512;
    const y = (i * 139) % 512;
    const shade = 115 + ((i * 29) % 40);
    gCtx.fillStyle = `rgb(${shade}, ${shade - 6}, ${shade - 14})`;
    gCtx.fillRect(x, y, 3, 3);
  }
  gCtx.strokeStyle = 'rgba(42, 46, 54, 0.42)';
  gCtx.lineWidth = 4;
  gCtx.strokeRect(2, 2, 508, 508);
  gCtx.beginPath();
  gCtx.moveTo(256, 0);
  gCtx.lineTo(256, 512);
  gCtx.moveTo(0, 256);
  gCtx.lineTo(512, 256);
  gCtx.stroke();
  const groundAsphalt = finalizeColorTexture(gCanvas, aniso, 14, 14);

  // 2. Outer desert sandstone terrain
  const [dCanvas, dCtx] = makeCanvas(512, 512);
  dCtx.fillStyle = '#c49d68';
  dCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const x = (i * 97) % 512;
    const y = (i * 193) % 512;
    const delta = ((i * 17) % 30) - 15;
    dCtx.fillStyle = `rgb(${196 + delta}, ${157 + delta}, ${104 + delta})`;
    dCtx.fillRect(x, y, 4, 2);
  }
  const desertTerrain = finalizeColorTexture(dCanvas, aniso, 24, 24);

  // 3. Corrugated Shipping Container helper
  const makeContainerTex = (baseHex: string, darkHex: string, lightHex: string) => {
    const [cCanvas, cCtx] = makeCanvas(256, 256);
    cCtx.fillStyle = baseHex;
    cCtx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 16) {
      cCtx.fillStyle = darkHex;
      cCtx.fillRect(x, 0, 6, 256);
      cCtx.fillStyle = lightHex;
      cCtx.fillRect(x + 6, 0, 3, 256);
    }
    cCtx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    cCtx.lineWidth = 10;
    cCtx.strokeRect(5, 5, 246, 246);
    // Stencil mark
    cCtx.fillStyle = 'rgba(255,255,255,0.55)';
    cCtx.fillRect(28, 36, 52, 12);
    cCtx.fillRect(28, 54, 34, 8);
    return finalizeColorTexture(cCanvas, aniso, 1, 1);
  };

  const containerTan = makeContainerTex('#b97d3c', '#8f5d28', '#d39754');
  const containerNavy = makeContainerTex('#2e4361', '#1e2c40', '#415b80');
  const containerOlive = makeContainerTex('#556347', '#3c4731', '#6d7e5c');

  // 4. Concrete bunker walls with panel lines & rivets
  const [wCanvas, wCtx] = makeCanvas(256, 256);
  wCtx.fillStyle = '#c5bca9';
  wCtx.fillRect(0, 0, 256, 256);
  wCtx.fillStyle = '#b4aa97';
  wCtx.fillRect(0, 200, 256, 56);
  wCtx.strokeStyle = 'rgba(65, 62, 56, 0.38)';
  wCtx.lineWidth = 3;
  wCtx.strokeRect(4, 4, 248, 248);
  wCtx.beginPath();
  wCtx.moveTo(128, 0);
  wCtx.lineTo(128, 256);
  wCtx.moveTo(0, 128);
  wCtx.lineTo(256, 128);
  wCtx.stroke();
  wCtx.fillStyle = 'rgba(50, 50, 48, 0.35)';
  for (const rx of [16, 112, 144, 240]) {
    for (const ry of [16, 112, 144, 240]) {
      wCtx.beginPath();
      wCtx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      wCtx.fill();
    }
  }
  const concreteWall = finalizeColorTexture(wCanvas, aniso, 2, 1);

  // 5. Wooden tactical supply crate
  const [crateCanvas, crateCtx] = makeCanvas(256, 256);
  crateCtx.fillStyle = '#a87442';
  crateCtx.fillRect(0, 0, 256, 256);
  crateCtx.strokeStyle = '#744b24';
  crateCtx.lineWidth = 18;
  crateCtx.strokeRect(9, 9, 238, 238);
  crateCtx.lineWidth = 14;
  crateCtx.beginPath();
  crateCtx.moveTo(18, 18);
  crateCtx.lineTo(238, 238);
  crateCtx.moveTo(238, 18);
  crateCtx.lineTo(18, 238);
  crateCtx.stroke();
  crateCtx.fillStyle = '#8b5c31';
  for (let y = 40; y < 220; y += 36) {
    crateCtx.fillRect(22, y, 212, 3);
  }
  const woodCrate = finalizeColorTexture(crateCanvas, aniso, 1, 1);

  // 6. Command Dome armored paneling + tactical C emblem
  const [domeCanvas, domeCtx] = makeCanvas(512, 512);
  domeCtx.fillStyle = '#dce3ec';
  domeCtx.fillRect(0, 0, 512, 512);
  domeCtx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
  domeCtx.lineWidth = 3;
  for (let y = 64; y < 512; y += 64) {
    domeCtx.beginPath();
    domeCtx.moveTo(0, y);
    domeCtx.lineTo(512, y);
    domeCtx.stroke();
  }
  for (let x = 0; x < 512; x += 128) {
    domeCtx.beginPath();
    domeCtx.moveTo(x, 0);
    domeCtx.lineTo(x, 512);
    domeCtx.stroke();
  }
  // Stylized tactical ring emblem on dome face
  domeCtx.strokeStyle = '#1e3a8a';
  domeCtx.lineWidth = 12;
  domeCtx.beginPath();
  domeCtx.arc(256, 256, 56, 0.4, Math.PI * 2 - 0.4);
  domeCtx.stroke();
  domeCtx.fillStyle = '#eab308';
  domeCtx.fillRect(250, 248, 42, 16);
  const domeArmor = finalizeColorTexture(domeCanvas, aniso, 2, 1);

  // 7. Hazard stripe trim
  const [hCanvas, hCtx] = makeCanvas(256, 64);
  hCtx.fillStyle = '#eab308';
  hCtx.fillRect(0, 0, 256, 64);
  hCtx.fillStyle = '#1e293b';
  for (let x = -64; x < 320; x += 48) {
    hCtx.beginPath();
    hCtx.moveTo(x, 64);
    hCtx.lineTo(x + 24, 64);
    hCtx.lineTo(x + 56, 0);
    hCtx.lineTo(x + 32, 0);
    hCtx.closePath();
    hCtx.fill();
  }
  const hazardStripe = finalizeColorTexture(hCanvas, aniso, 4, 1);

  // 8. Soft radial contact shadow
  const [sCanvas, sCtx] = makeCanvas(128, 128);
  const grad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.22)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(sCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;

  const all = [
    groundAsphalt,
    desertTerrain,
    containerTan,
    containerNavy,
    containerOlive,
    concreteWall,
    woodCrate,
    domeArmor,
    hazardStripe,
    contactShadow,
  ];

  return {
    groundAsphalt,
    desertTerrain,
    containerTan,
    containerNavy,
    containerOlive,
    concreteWall,
    woodCrate,
    domeArmor,
    hazardStripe,
    contactShadow,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}
