import Component from './component.mjs';

const html = /*html*/ `
<div class="radio-group">
</div>
`;

const itemHtml = /*html*/ `
<div class="item">
  <input type="radio">
  <label></label>
</div>
`;

const css = /*css*/ `
.radio-group {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
  margin: 0;
  padding: 0;
  gap: 0.25rem;
}

.radio-group .item {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
}

.radio-group .item input {
  display: none;
}

.radio-group .item label {
  flex-grow: 1;
  background-color: hsla(0, 0%, 0%, 0.5);
  color: hsl(0, 0%, 100%);
  text-align: center;
  padding: 0.5rem;
  min-width: 10ch;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 0.25rem;
}

.radio-group .item input:checked+label {
  background-color: hsl(45, 100%, 50%);
  color: hsl(0, 0%, 0%);
}

.radio-group .item input:disabled+label {
  color: hsl(0, 0%, 100%, 0.8);
}

.radio-group .item input:disabled:checked+label {
  background-color: hsla(45, 100%, 50%, 0.8);
}
`;

class RadioGroupOptions {
  assignedId = '';
  /** @type {{name: string, value: string}[]} */
  items = [];
  /** @type {string | undefined} */
  defaultValue;
}

export default class RadioGroup extends Component {
  /** @type {HTMLInputElement[]} */
  inputs = [];

  _disabled = false;
  _currentValue = '';

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this.inputs.forEach((input) => {
      input.disabled = value;
    });
  }

  get currentValue() {
    return this._currentValue;
  }

  set currentValue(value) {
    for (let i = 0; i < this.inputs.length; ++i) {
      if (this.inputs[i].value == value) {
        this.inputs[i].checked = true;
        break;
      }
    }
    this._currentValue = value;
  }

  /**
   * @param {HTMLElement} parent
   * @param {RadioGroupOptions} options
   * @param {boolean} replacing
   */
  constructor(parent, options, replacing = false) {
    super(parent, html, css, replacing);

    for (let i = 0; i < options.items.length; ++i) {
      const el = Component.fromHTML(itemHtml);
      const input = el.querySelector('input');
      input.name = options.assignedId;
      input.value = options.items[i].name;
      input.id = `${options.assignedId}-${options.items[i].name}`;
      const label = el.querySelector('label');
      label.htmlFor = input.id;
      label.innerText = options.items[i].value;
      if (typeof options.defaultValue === 'string' && input.value === options.defaultValue) {
        input.checked = true;
        this._currentValue = input.value;
      }
      this.root.appendChild(el);
      this.inputs.push(input);

      input.addEventListener('change', (e) => {
        if (input.checked) {
          this._currentValue = input.value;
          this.dispatchEvent(new Event('change'));
          e.stopPropagation();
        }
      });
    }
  }
}
