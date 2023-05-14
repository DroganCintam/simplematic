import Component from './component.mjs';

const html = /*html*/ `
<div id="ASSIGNED_ID" class="value-selector">
  <div class="value-list"></div>
</div>
`;

const customHtml = /*html*/ `
<input type="number" class="custom"/>
`;

const presetHtml = /*html*/ `
<div class="preset">
  <input type="checkbox" />
  <label></label>
</div>
`;

const css = /*css*/ `
.value-selector .value-list {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
  margin: 0;
  padding: 0;
}

.value-selector .value-list > * {
  margin: 0.1rem;
}

.value-selector .value-list .custom {
  width: 10ch;
  font-size: 0.75rem;
}

.value-selector .value-list .preset {
  flex-grow: 1;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
}

.value-selector .value-list .preset>input {
  display: none;
}

.value-selector .value-list .preset label {
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

.value-selector .value-list .preset input:checked+label {
  background-color: hsl(45, 100%, 50%);
  color: hsl(0, 0%, 0%);
}

.value-selector .value-list .preset input:disabled+label {
  color: hsl(0, 0%, 100%, 0.8);
}

.value-selector .value-list .preset input:disabled:checked+label {
  background-color: hsla(45, 100%, 50%, 0.8);
}
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
  /** @type {string[] | undefined} */
  extraClasses = undefined;
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
    super(parent, html.replace(/ASSIGNED_ID/g, options.assignedId), css, replacing);

    options.hasCustom = options.hasCustom ?? defaultOptions.hasCustom;
    options.values = options.values ?? defaultOptions.values;

    const valueList = this.root.querySelector('.value-list');

    if (options.hasCustom) {
      this.customInput = Component.fromHTML(customHtml);
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
        this.dispatchEvent(new Event('change'));
      });
    }

    for (let i = 0; i < options.values.length; ++i) {
      const el = Component.fromHTML(presetHtml);
      const input = el.querySelector('input');
      input.id = `${options.assignedId}-value-${i}`;
      const label = el.querySelector('label');
      label.htmlFor = input.id;
      label.innerText = options.values[i].name;
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
          this.dispatchEvent(new Event('change'));
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

    if (options.extraClasses) {
      this.root.classList.add(options.extraClasses);
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
