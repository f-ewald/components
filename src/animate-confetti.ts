import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

interface Particle {
  color: string;
  x: number;
  y: number;
  diameter: number;
  tilt: number;
  tiltAngleIncrement: number;
  tiltAngle: number;
}

/**
 * Fullscreen confetti animation overlay, rendered on a fixed-position canvas.
 * Starts automatically on first render and stops after `duration` ms.
 *
 * @element animate-confetti
 */
@customElement("animate-confetti")
export class AnimateConfetti extends LitElement {
  /** How long the confetti streams before stopping, in ms. */
  @property({ type: Number })
  duration: number = 6000;

  private maxParticleCount = 150; // set max confetti count
  private particleSpeed = 2; // set the particle animation speed

  private particles: Particle[] = [];
  private streamingConfetti: boolean = false;
  private colors = [
    "DodgerBlue",
    "OliveDrab",
    "Gold",
    "Pink",
    "SlateBlue",
    "LightBlue",
    "Violet",
    "PaleGreen",
    "SteelBlue",
    "SandyBrown",
    "Chocolate",
    "Crimson",
  ];
  private waveAngle: number = 0.0;
  private animationTimer?: number;

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._handleResize);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._handleResize);
    this.stopConfetti();
  }

  static override styles = css`
    #confetti-canvas {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999999;
      pointer-events: none;
    }
  `;

  /**
   * @returns The canvas element
   */
  private get _canvas(): HTMLCanvasElement {
    return <HTMLCanvasElement>this.shadowRoot!.getElementById("confetti-canvas")!;
  }

  /**
   * Resize canvas to browser size.
   */
  private _handleResize = () => {
    const canvas = this._canvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  /**
   * Start confetti once shadow dom has been rendered for the first time.
   */
  protected override firstUpdated(): void {
    this.startConfetti();
    setTimeout(() => {
      this.stopConfetti();
    }, this.duration);
  }

  override render() {
    return html`<canvas id="confetti-canvas"></canvas>`;
  }

  private startConfetti() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this._handleResize();

    while (this.particles.length < this.maxParticleCount)
      this.particles.push(this.resetParticle({} as Particle, width, height));
    this.streamingConfetti = true;
    if (this.animationTimer == undefined) {
      this.runAnimation();
    }
  }

  private runAnimation = () => {
    const canvas = this._canvas;
    const context = canvas.getContext("2d");
    context!.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (this.particles.length === 0) this.animationTimer = undefined;
    else {
      this.updateParticles();
      this.drawParticles(context);
      this.animationTimer = window.requestAnimationFrame(this.runAnimation);
    }
  };

  /**
   * Stop confetti and clean up after reasonable time.
   */
  private stopConfetti() {
    this.streamingConfetti = false;
    setTimeout(this._cleanup, 5000);
  }

  /**
   * Removes any associated particle data from internal storage to regain memory.
   */
  private _cleanup(): void {
    this.particles = [];
  }

  private updateParticles() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    let particle: Particle;
    this.waveAngle += 0.01;
    for (let i = 0; i < this.particles.length; i++) {
      particle = this.particles[i];
      if (!this.streamingConfetti && particle.y < -15) particle.y = height + 100;
      else {
        particle.tiltAngle += particle.tiltAngleIncrement;
        particle.x += Math.sin(this.waveAngle);
        particle.y += (Math.cos(this.waveAngle) + particle.diameter + this.particleSpeed) * 0.5;
        particle.tilt = Math.sin(particle.tiltAngle) * 15;
      }
      if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
        if (this.streamingConfetti && this.particles.length <= this.maxParticleCount)
          this.resetParticle(particle, width, height);
        else {
          this.particles.splice(i, 1);
          i--;
        }
      }
    }
  }

  private drawParticles(context: CanvasRenderingContext2D | null) {
    if (!context) return;
    let particle: Particle;
    let x: number;
    for (let i = 0; i < this.particles.length; i++) {
      particle = this.particles[i];
      context.beginPath();
      context.lineWidth = particle.diameter;
      context.strokeStyle = particle.color;
      x = particle.x + particle.tilt;
      context.moveTo(x + particle.diameter / 2, particle.y);
      context.lineTo(x, particle.y + particle.tilt + particle.diameter / 2);
      context.stroke();
    }
  }

  private resetParticle(particle: Particle, width: number, height: number): Particle {
    particle.color = this.colors[(Math.random() * this.colors.length) | 0];
    particle.x = Math.random() * width;
    particle.y = Math.random() * height - height;
    particle.diameter = Math.random() * 10 + 5;
    particle.tilt = Math.random() * 10 - 10;
    particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
    particle.tiltAngle = 0;
    return particle;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "animate-confetti": AnimateConfetti;
  }
}
