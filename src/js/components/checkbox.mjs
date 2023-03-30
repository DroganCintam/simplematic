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
  get value() {
    return this.input.value;
  }

  /**
   * @param {boolean} isSet
   */
  set value(isSet) {
    this.input.value = isSet;
  }

  /** @type {(target: Checkbox) => void} */
  onChange;

  /**
   * @param {HTMLElement} parent
   * @param {string} assignedId
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
      if (this.onChange) this.onChange(this);
    });
  }
}
