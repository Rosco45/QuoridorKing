class HapticManager {
  private _enabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem('quoridor_haptics_enabled');
      if (saved !== null) {
        this._enabled = JSON.parse(saved);
      }
    } catch {
      this._enabled = true;
    }
  }

  public isEnabled(): boolean {
    return this._enabled;
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    try {
      localStorage.setItem('quoridor_haptics_enabled', JSON.stringify(this._enabled));
    } catch {
      // ignore
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this._enabled);
    return this._enabled;
  }

  private trigger(pattern: number | number[]) {
    if (!this._enabled) return;
    try {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Safe fallback on iOS / Safari
    }
  }

  public vibrateTap() {
    this.trigger(8);
  }

  public vibrateMove() {
    this.trigger(10);
  }

  public vibrateJump() {
    this.trigger([15, 30, 15]);
  }

  public vibrateWallPlaced() {
    this.trigger(20);
  }

  public vibrateInvalid() {
    this.trigger([40, 60, 40]);
  }

  public vibrateVictory() {
    this.trigger([30, 50, 30, 50, 100]);
  }

  // Alias methods for compatibility
  public move() {
    this.vibrateMove();
  }

  public jump() {
    this.vibrateJump();
  }

  public wallPlaced() {
    this.vibrateWallPlaced();
  }

  public error() {
    this.vibrateInvalid();
  }

  public victory() {
    this.vibrateVictory();
  }
}

export const hapticManager = new HapticManager();
