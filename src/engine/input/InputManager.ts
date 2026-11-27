export interface InputSnapshot {
  moveX: number; // -1 (left) to +1 (right)
  moveZ: number; // -1 (backward) to +1 (forward)
  lookDeltaX: number;
  lookDeltaY: number;
  zoomDelta: number;
  sprint: boolean;
  jumpPressed: boolean;
}

export class InputManager {
  private readonly heldKeys = new Set<string>();
  private jumpQueued = false;
  private lookDeltaX = 0;
  private lookDeltaY = 0;
  private zoomDelta = 0;

  private joyX = 0;
  private joyY = 0;
  private touchJumpQueued = false;
  private touchSprint = false;

  private isMouseDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private lookTouchId: number | null = null;
  private lastTouchX = 0;
  private lastTouchY = 0;

  private attachedElement: HTMLElement | null = null;

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      if (!this.heldKeys.has('Space')) {
        this.jumpQueued = true;
      }
    }
    this.heldKeys.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private readonly onBlur = () => {
    this.heldKeys.clear();
    this.isMouseDragging = false;
    this.lookTouchId = null;
    this.joyX = 0;
    this.joyY = 0;
  };

  private readonly onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0 && e.button !== 2) return;
    this.isMouseDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private readonly onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement === this.attachedElement) {
      this.lookDeltaX += e.movementX;
      this.lookDeltaY += e.movementY;
      return;
    }
    if (!this.isMouseDragging) return;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.lookDeltaX += dx;
    this.lookDeltaY += dy;
  };

  private readonly onMouseUp = () => {
    this.isMouseDragging = false;
  };

  private readonly onWheel = (e: WheelEvent) => {
    this.zoomDelta += e.deltaY * 0.01;
  };

  private readonly onTouchStart = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (this.lookTouchId === null) {
        this.lookTouchId = t.identifier;
        this.lastTouchX = t.clientX;
        this.lastTouchY = t.clientY;
      }
    }
  };

  private readonly onTouchMove = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.lookTouchId) {
        const dx = t.clientX - this.lastTouchX;
        const dy = t.clientY - this.lastTouchY;
        this.lastTouchX = t.clientX;
        this.lastTouchY = t.clientY;
        this.lookDeltaX += dx * 1.4;
        this.lookDeltaY += dy * 1.4;
      }
    }
  };

  private readonly onTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.lookTouchId) {
        this.lookTouchId = null;
      }
    }
  };

  public attach(element: HTMLElement): void {
    this.detach();
    this.attachedElement = element;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    element.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    element.addEventListener('wheel', this.onWheel, { passive: true });

    element.addEventListener('touchstart', this.onTouchStart, { passive: true });
    element.addEventListener('touchmove', this.onTouchMove, { passive: true });
    element.addEventListener('touchend', this.onTouchEnd, { passive: true });
    element.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
  }

  public detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);

    if (this.attachedElement) {
      this.attachedElement.removeEventListener('mousedown', this.onMouseDown);
      this.attachedElement.removeEventListener('wheel', this.onWheel);
      this.attachedElement.removeEventListener('touchstart', this.onTouchStart);
      this.attachedElement.removeEventListener('touchmove', this.onTouchMove);
      this.attachedElement.removeEventListener('touchend', this.onTouchEnd);
      this.attachedElement.removeEventListener('touchcancel', this.onTouchEnd);
      this.attachedElement = null;
    }
  }

  public setVirtualJoystick(x: number, y: number): void {
    this.joyX = x;
    this.joyY = y;
  }

  public triggerTouchJump(): void {
    this.touchJumpQueued = true;
  }

  public setTouchSprint(active: boolean): void {
    this.touchSprint = active;
  }

  public consumeSnapshot(out: InputSnapshot): InputSnapshot {
    let kbX = 0;
    let kbZ = 0;

    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) kbX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) kbX += 1;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) kbZ += 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) kbZ -= 1;

    const rawX = Math.abs(this.joyX) > 0.05 ? this.joyX : kbX;
    const rawZ = Math.abs(this.joyY) > 0.05 ? this.joyY : kbZ;
    const len = Math.hypot(rawX, rawZ);

    out.moveX = len > 1 ? rawX / len : rawX;
    out.moveZ = len > 1 ? rawZ / len : rawZ;
    out.lookDeltaX = this.lookDeltaX;
    out.lookDeltaY = this.lookDeltaY;
    out.zoomDelta = this.zoomDelta;
    out.sprint =
      this.touchSprint ||
      this.heldKeys.has('ShiftLeft') ||
      this.heldKeys.has('ShiftRight');
    out.jumpPressed = this.jumpQueued || this.touchJumpQueued;

    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    this.zoomDelta = 0;
    this.jumpQueued = false;
    this.touchJumpQueued = false;

    return out;
  }
}
