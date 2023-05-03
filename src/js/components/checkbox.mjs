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
    super(parent, html.replace(/ASSIGNED_ID/g, options.assignedId), replacing);

    if (options.extraClasses) {
      this.root.classList.add(options.extraClasses);
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
