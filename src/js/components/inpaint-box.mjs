import Checkbox from './checkbox.mjs';
import Component from './component.mjs';

const html = /*html*/ `
<div data-inpaint-box>
  <span data-mover></span>
  <span data-chk-inpaint></span>
  <div class="tools inpaint-options">
    <div class="buttons">
      <div class="radio">
        <input id="inpaint-hand-tool" type="radio" name="inpaint-tool" checked data-hand-tool>
        <label for="inpaint-hand-tool" class="left-button" title="Pan">
          <img src="/img/hand-solid.svg">
        </label>
      </div>
      <div class="radio">
        <input id="inpaint-brush-tool" type="radio" name="inpaint-tool" data-brush-tool>
        <label for="inpaint-brush-tool" class="right-button" title="Brush">
          <img src="/img/paintbrush-solid.svg">
        </label>
      </div>
    </div>
    <div class="buttons redo-undo">
      <button type="button" title="Redo" class="left-button" data-btn-redo>
        <img src="/img/rotate-right-solid.svg">
      </button>
      <button type="button" title="Undo" class="right-button" data-btn-undo>
        <img src="/img/rotate-left-solid.svg">
      </button>
    </div>
  </div>
  <div class="brush-size inpaint-options">
    <label for="inpaint-brush-size">Brush size:</label>
    <input id="inpaint-brush-size" type="range" class="w100p" min="1" max="32" step="1" data-brush-size>
  </div>
  <span data-chk-inpaint-invert></span>
</div>
`;

const css = /*css*/ `
[data-inpaint-box] {
  height: auto;
  background-color: hsla(0, 0%, 100%, 0.2);
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
  padding: 0.25rem;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: 0.25rem;
}

[data-inpaint-box].inside-canvas {
  position: absolute;
  left: 1rem;
  top: 1rem;
  width: 16rem;
}

[data-inpaint-box].outside-canvas {
  position: relative;
  width: 100%;
}

[data-inpaint-box] [data-mover] {
  margin: 0.25rem 0;
  width: 6rem;
  height: 0.5rem;
  background-color: hsla(0, 0%, 100%, 0.9);
  border-radius: 0.25rem;
  cursor: move;
}

[data-inpaint-box] .tools {
  display: flex;
  flex-flow: row column;
  gap: 0.25rem;
  justify-content: space-between;
  width: 100%;
  border-top: 1px solid hsla(0, 0%, 100%, 0.5);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

[data-inpaint-box] .buttons {
  display: flex;
  flex-flow: row column;
}

[data-inpaint-box] .radio {
}

[data-inpaint-box] .radio input {
  display: none;
}

[data-inpaint-box] .radio label {
  width: 3rem;
  height: 2rem;
  border: 1px solid hsl(0, 0%, 0%);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

[data-inpaint-box] .radio input:not(:checked) + label {
  background-color: hsla(45, 100%, 50%, 0.25);
}

[data-inpaint-box] .radio input:checked + label {
  background-color: hsla(45, 100%, 50%, 1);
}

[data-inpaint-box] .left-button {
  border-radius: 0.5rem 0 0 0.5rem;
}

[data-inpaint-box] .right-button {
  border-radius: 0 0.5rem 0.5rem 0;
}

[data-inpaint-box] .radio label img {
  width: 1rem;
  height: 1rem;
}

[data-inpaint-box] .redo-undo button {
  width: 3rem;
  height: 2rem;
  border: 1px solid hsl(0, 0%, 0%);
}

[data-inpaint-box] .brush-size {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  padding: 0.25rem 0;
}

[data-inpaint-box] .brush-size label {
  font-size: 0.8rem;
  color: hsla(0, 0%, 100%, 1);
}
`;

export default class InpaintBox extends Component {
  /** @type {Checkbox} */
  checkbox;

  /** @type {HTMLInputElement} */
  handToolRadio;
  /** @type {HTMLInputElement} */
  brushToolRadio;
  /** @type {HTMLButtonElement} */
  redoButton;
  /** @type {HTMLButtonElement} */
  undoButton;
  /** @type {HTMLLabelElement} */
  brushSizeLabel;
  /** @type {HTMLInputElement} */
  brushSize;
  /** @type {Checkbox} */
  invertCheckbox;

  /** @type {(boolean) => void} */
  onInpaintingChanged;
  /** @type {() => void} */
  onRedo;
  /** @type {() => void} */
  onUndo;

  get isInpainting() {
    return this.checkbox.checked;
  }

  get isInpaintingInvert() {
    return this.invertCheckbox.checked;
  }

  get brushSizeValue() {
    return this.brushSize.valueAsNumber;
  }

  get isUsingBrush() {
    return this.brushToolRadio.checked;
  }

  set disabled(value) {
    this.checkbox.disabled = value;
    this.redoButton.disabled = value;
    this.undoButton.disabled = value;
    this.invertCheckbox.disabled = value;
  }

  /**
   * @param {HTMLElement} parent
   */
  constructor(parent) {
    super(parent, html, css, false);

    this.checkbox = new Checkbox(
      this.root.querySelector('[data-chk-inpaint]'),
      {
        assignedId: 'chk-inpaint',
        label: 'Inpaint',
        extraClasses: ['w100p'],
      },
      true
    );

    this.handToolRadio = this.root.querySelector('[data-hand-tool]');
    this.brushToolRadio = this.root.querySelector('[data-brush-tool]');
    this.redoButton = this.root.querySelector('[data-btn-redo]');
    this.undoButton = this.root.querySelector('[data-btn-undo]');
    this.brushSizeLabel = this.root.querySelector('.brush-size').querySelector('label');
    this.brushSize = this.root.querySelector('[data-brush-size]');

    this.invertCheckbox = new Checkbox(
      this.root.querySelector('[data-chk-inpaint-invert]'),
      {
        assignedId: 'chk-inpaint-invert',
        label: 'Inpaint not masked area',
        extraClasses: ['w100p', 'inpaint-options'],
      },
      true
    );

    this.checkbox.onChange = (chk) => {
      this.toggle(chk.checked);
      this.onInpaintingChanged(chk.checked);
    };

    this.handToolRadio.addEventListener('change', () => {
      this.onInpaintingChanged(this.checkbox.checked);
    });
    this.brushToolRadio.addEventListener('change', () => {
      this.onInpaintingChanged(this.checkbox.checked);
    });

    this.redoButton.addEventListener('click', () => {
      this.onRedo();
    });
    this.undoButton.addEventListener('click', () => {
      this.onUndo();
    });

    this.brushSizeLabel.innerText = `Brush size: ${this.brushSize.value}`;
    this.brushSize.addEventListener('input', () => {
      this.brushSizeLabel.innerText = `Brush size: ${this.brushSize.value}`;
    });

    this.initMover();

    this.toggle(false);
  }

  toggle(/** @type {Boolean} */ visible) {
    this.root
      .querySelectorAll('.inpaint-options')
      .forEach((el) => (el.style.display = visible ? '' : 'none'));
  }

  switchToHandTool() {
    this.handToolRadio.checked = true;
  }

  toggleInsideCanvas(isInside) {
    this.root.classList.toggle('inside-canvas', isInside);
    this.root.classList.toggle('outside-canvas', !isInside);
    this.root.querySelector('[data-mover]').style.display = isInside ? '' : 'none';
  }

  initMover() {
    const mover = this.root.querySelector('[data-mover]');

    const root = this.root;
    const rootStyle = this.root.style;

    let isMoving = false;
    let lastX = 0,
      lastY = 0;

    /** @type {DOMRect} */
    let rootRect;
    /** @type {DOMRect} */
    let parentRect;

    const onBegin = (x, y) => {
      isMoving = true;
      lastX = x;
      lastY = y;
      rootRect = root.getBoundingClientRect();
      parentRect = root.parentElement.getBoundingClientRect();
    };
    const onEnd = () => {
      isMoving = false;
    };
    const onMove = (x, y) => {
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;

      let left = root.offsetLeft + dx;
      let top = root.offsetTop + dy;
      if (left < 0) {
        left = 0;
      } else if (left > parentRect.width - rootRect.width) {
        left = parentRect.width - rootRect.width;
      }
      if (top < 0) {
        top = 0;
      } else if (top > parentRect.height - rootRect.height) {
        top = parentRect.height - rootRect.height;
      }

      rootStyle.left = left + 'px';
      rootStyle.top = top + 'px';
    };

    root.addEventListener('mousedown', (e) => {
      if (e.button == 0 && (e.target === mover || e.target === root)) {
        e.preventDefault();
        onBegin(e.pageX, e.pageY);
      }
    });
    root.addEventListener('mouseup', onEnd);
    root.addEventListener('mousemove', (e) => {
      if (isMoving) {
        e.preventDefault();
        onMove(e.pageX, e.pageY);
      }
    });

    root.addEventListener('touchstart', (e) => {
      if (e.target === mover || e.target === root) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        onBegin(touch.pageX, touch.pageY);
      }
    });
    root.addEventListener('touchend', onEnd);
    root.addEventListener('touchcancel', onEnd);
    root.addEventListener('touchmove', (e) => {
      if (isMoving) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        onMove(touch.pageX, touch.pageY);
      }
    });
  }

  show() {
    this.root.style.display = '';
  }

  hide() {
    this.root.style.display = 'none';
  }
}
