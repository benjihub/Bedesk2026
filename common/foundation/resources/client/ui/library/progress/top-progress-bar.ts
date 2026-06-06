export class TopProgressBar {
  private animationDuration = 300; /*ms*/

  private readonly el: HTMLElement;
  private hiding = false;
  private value = 0;
  private visible = false;
  private trickleInterval: number | undefined;

  constructor() {
    this.el = this.createProgressElement();
  }

  show() {
    if (!this.visible) {
      this.visible = true;
      this.installProgressElement();
    }
  }

  hide() {
    if (this.visible && !this.hiding) {
      this.setValue(1);
      this.hiding = true;
      this.fadeProgressElement(() => {
        this.uninstallProgressElement();
        this.stopTrickling();
        this.visible = false;
        this.hiding = false;
        this.setValue(0);
      });
    }
  }

  private setValue(value: number) {
    this.value = value;
    this.refresh();
  }

  private installProgressElement() {
    this.el.style.width = '0';
    this.el.style.opacity = '1';
    document.documentElement.insertBefore(this.el, document.body);
    requestAnimationFrame(() => {
      this.refresh();
      this.startTrickling();
    });
  }

  private fadeProgressElement(callback: () => void) {
    this.el.style.opacity = '0';
    setTimeout(callback, this.animationDuration * 1.5);
  }

  private uninstallProgressElement() {
    if (this.el.parentNode) {
      document.documentElement.removeChild(this.el);
    }
  }

  private startTrickling() {
    if (!this.trickleInterval) {
      this.trickleInterval = window.setInterval(
        this.trickle,
        this.animationDuration,
      );
    }
  }

  private stopTrickling() {
    window.clearInterval(this.trickleInterval);
    delete this.trickleInterval;
  }

  private trickle = () => {
    this.setValue(this.value + Math.random() / 100);
  };

  private refresh() {
    requestAnimationFrame(() => {
      this.el.style.width = `${10 + this.value * 90}%`;
    });
  }

  private createProgressElement() {
    const element = document.createElement('div');
    element.className = 'be-top-progress-bar';
    return element as HTMLElement;
  }
}
