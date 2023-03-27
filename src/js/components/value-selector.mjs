import Component from './component.mjs';

const html = /*html*/ `
<div id="ASSIGNED_ID" class="value-selector-ASSIGNED_ID">
  <div class="value-list"></div>

  <style>
    .value-selector-ASSIGNED_ID .value-list {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      margin: 0;
      padding: 0;
    }

    .value-selector-ASSIGNED_ID .value-list > * {
      margin: 0.1rem;
    }

    .value-selector-ASSIGNED_ID .value-list .custom {
      width: 10ch;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.75rem;
      padding: 0.5rem;
      outline: none;
      background-color: hsla(0, 0%, 0%, 0.5);
      color: hsl(0, 0%, 100%);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 0.5rem;
    }

    .value-selector-ASSIGNED_ID .value-list .preset {
      flex-grow: 1;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: center;
    }

    .value-selector-ASSIGNED_ID .value-list .preset>input {
      display: none;
    }

    .value-selector-ASSIGNED_ID .value-list .preset label {
      flex-grow: 1;
      background-color: hsla(0, 0%, 0%, 0.5);
      color: hsl(0, 0%, 100%);
      text-align: center;
      padding: 0.5rem;
      min-width: 10ch;
      font-size: 0.75rem;
      cursor: pointer;
      border-radius: 0.5rem;
    }

    .value-selector-ASSIGNED_ID .value-list .preset input:checked+label {
      background-color: hsl(45, 100%, 50%);
      color: hsl(0, 0%, 0%);
    }

    .value-selector-ASSIGNED_ID .value-list .preset input:disabled+label {
      color: hsl(0, 0%, 100%, 0.8);
    }

    .value-selector-ASSIGNED_ID .value-list .preset input:disabled:checked+label {
      background-color: hsla(45, 100%, 50%, 0.8);
    }
  </style>
</div>
`;

class SelectorOptions {
  assignedId = '';
  defaultValue = 0;
  minValue = 0;
  maxValue = 9999;
  isInteger = true;
  hasCustom = true;
  /** @type {{name: string, value: number}[]} */
  values = [];
}

const defaultOptions = new SelectorOptions();

class Preset {
  name = '';
  value = 0;

  /** @type {HTMLDivElement} */
  div;
  /** @type {HTMLInputElement} */
  checkbox;
}

export default class ValueSelector extends Component {
  /** @type {HTMLInputElement} */
  customInput;
  /** @type {Preset[]} */
  presets = [];

  /** @type {Preset} */
  selectedPreset = null;

  get currentValue() {
    if (this.customInput != null) {
      return parseFloat(this.customInput.value);
    } else if (this.selectedPreset != null) {
      return this.selectedPreset.value;
    } else {
      return 0;
    }
  }

  set currentValue(value) {
    let matchedPreset = null;
    for (let i = 0; i < this.presets.length && matchedPreset == null; ++i) {
      const preset = this.presets[i];
      if (preset.value == value) {
        matchedPreset = preset;
        break;
      }
    }
    this.switchPreset(matchedPreset);
    if (matchedPreset == null && this.customInput != null) {
      this.customInput.value = value;
    }
  }

  set disabled(/** @type {Boolean} */ isDisabled) {
    if (this.customInput) {
      this.customInput.disabled = isDisabled;
    }
    for (let i = 0; i < this.presets.length; ++i) {
      this.presets[i].checkbox.disabled = isDisabled;
    }
  }

  /**
   * @param {HTMLElement} parent
   * @param {SelectorOptions} options
   */
  constructor(parent, options, replacing = false) {
    super(parent, html.replace(/ASSIGNED_ID/g, options.assignedId), replacing);

    options.hasCustom = options.hasCustom ?? defaultOptions.hasCustom;
    options.values = options.values ?? defaultOptions.values;

    const valueList = this.root.querySelector('.value-list');

    if (options.hasCustom) {
      this.customInput = Object.assign(document.createElement('input'), {
        type: 'number',
        className: 'custom',
      });
      valueList.appendChild(this.customInput);
      this.customInput.addEventListener('change', () => {
        let v = this.customInput.value;
        if (options.isInteger && v != Math.floor(v)) {
          v = this.customInput.value = Math.floor(v);
        }
        if (v < options.minValue) {
          v = this.customInput.value = options.minValue;
        }
        if (v > options.maxValue) {
          v = this.customInput.value = options.maxValue;
        }
        let matchedPreset = null;
        for (let i = 0; i < this.presets.length && matchedPreset == null; ++i) {
          const preset = this.presets[i];
          if (preset.value == v) {
            matchedPreset = preset;
          }
        }
        this.switchPreset(matchedPreset);
      });
    }

    for (let i = 0; i < options.values.length; ++i) {
      const el = Object.assign(document.createElement('div'), {
        className: 'preset',
      });
      const input = Object.assign(document.createElement('input'), {
        type: 'checkbox',
        id: `${options.assignedId}-value-${i}`,
      });
      const label = Object.assign(document.createElement('label'), {
        htmlFor: `${options.assignedId}-value-${i}`,
        innerText: options.values[i].name,
      });
      el.appendChild(input);
      el.appendChild(label);
      valueList.appendChild(el);

      const preset = Object.assign(new Preset(), {
        name: options.values[i].name,
        value: options.values[i].value,
        div: el,
        checkbox: input,
      });
      this.presets.push(preset);

      if (options.defaultValue == options.values[i].value) {
        this.selectedPreset = preset;
      }

      input.addEventListener('change', () => {
        if (input.checked) {
          this.switchPreset(preset);
        } else {
          input.checked = true;
        }
      });
    }

    if (this.selectedPreset) {
      if (options.hasCustom) {
        this.customInput.value = this.selectedPreset.value;
      }
      this.selectedPreset.checkbox.checked = true;
    } else if (options.hasCustom) {
      this.customInput.value = options.defaultValue;
    }
  }

  switchPreset(/** @type {Preset} */ newPreset) {
    if (this.selectedPreset && this.selectedPreset != newPreset) {
      this.selectedPreset.checkbox.checked = false;
      this.selectedPreset = newPreset;
      if (this.selectedPreset != null) {
        this.selectedPreset.checkbox.checked = true;
        if (this.customInput != null) {
          this.customInput.value = this.selectedPreset.value;
        }
      }
    } else if (this.selectedPreset == null && newPreset != null) {
      this.selectedPreset = newPreset;
      this.selectedPreset.checkbox.checked = true;
      if (this.customInput != null) {
        this.customInput.value = newPreset.value;
      }
    }
  }
}
