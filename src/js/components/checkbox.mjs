import Component from './component.mjs';

const html = /*html*/ `
<div class="checkbox">
  <input type="checkbox" id="ASSIGNED_ID-checkbox"/>
  <label for="ASSIGNED_ID-checkbox">
    <span class="check"></span>
    <span class="label-content"></span>
  </label>
</div>
`;

const css = /*css*/ `
.checkbox {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-start;
}

.checkbox input {
  display: none;
}

.checkbox label {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  column-gap: 0.5rem;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.5rem;
}

.checkbox input + label {
  background-color: hsla(0, 0%, 0%, 0.5);
  color: hsl(0, 0%, 100%);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.checkbox input:checked + label {
  background-color: hsl(45, 100%, 50%);
  color: hsl(0, 0%, 0%);
}

.checkbox input + label .check {
  width: 1rem;
  height: 1rem;
  background-image: url('/img/square-regular.svg');
  background-repeat: no-repeat;
}

.checkbox input:checked + label .check {
  background-image: url('/img/square-check-solid.svg');
}

.checkbox input:disabled+label {
  color: hsla(0, 0%, 100%, 0.5);
}

.checkbox input:disabled:checked + label {
  background-color: hsla(45, 100%, 50%, 0.8);
  color: hsl(0, 0%, 0%);
}
`;

export default class Checkbox extends Component {
  /** @type {HTMLInputElement} */
  input;

  /** @type {boolean} */
  get checked() {
    return this.input.checked;
  }

  set checked(value) {
    this.input.checked = value;
    this._lastValue = value;
  }

  /** @type {boolean} */
  get disabled() {
    return this.input.disabled;
  }

  set disabled(value) {
    this.input.disabled = value;
  }

  programmatic = false;

  /** @type {(target: Checkbox) => void} */
  onChange;

  _lastValue = false;

  /**
   * @param {HTMLElement} parent
   * @param {{ assignedId: string, label: string, extraClasses: string[] | undefined }} options
   * @param {boolean} replacing
   */
  constructor(parent, options, replacing = true) {
    super(parent, html.replace(/ASSIGNED_ID/g, options.assignedId), css, replacing);

    if (options.extraClasses) {
      this.root.classList.add(...options.extraClasses);
    }
    this.root.querySelector('label').querySelector('.label-content').innerText = options.label;

    this.input = this.root.querySelector('input');
    this.input.addEventListener('change', () => {
      if (this.programmatic) {
        this.checked = this._lastValue;
        return;
      }
      if (this.onChange) this.onChange(this);
    });

    this._lastValue = this.checked;
  }
}
