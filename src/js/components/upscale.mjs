import Api from '../api.mjs';
import AppConfig from '../types/app-config.mjs';
import Checkbox from './checkbox.mjs';
import Tab from './tab.mjs';

const html = /*html*/ `
<div id="upscale-tab" class="app-tab" style="display:none">
  <div class="panes">
    <div class="pane input-pane">
      <div class="input-wrapper w100p">
        <input class="input-image-file" type="file" accept="image/png">
        <img class="input-image" alt="Input image" style="display: none">
      </div>
    </div>
    <div class="pane config-pane">
      <div class="option w100p">
        <button type="button" class="btn-upscale" title="Upscale the input image">
          <img src="/img/up-right-and-down-left-from-center-solid-black.svg">
          UPSCALE
        </button>
      </div>
      <div class="option w50p">
        <span class="chk-scale-by"></span>
      </div>
      <div class="option w50p">
        <label class="heading">Scale by</label>
        <input type="number" class="txt-scale-by" value="4" min="1" max="8" step="0.5" onchange="validateInputRange(this)">
      </div>
      <div class="option w50p">
        <label class="heading">Width</label>
        <input type="number" class="txt-scale-width" value="512" min="1" step="32" onchange="validateInputRange(this)">
      </div>
      <div class="option w50p">
        <label class="heading">Height</label>
        <input type="number" class="txt-scale-height" value="512" min="1" step="32" onchange="validateInputRange(this)">
      </div>
      <div class="option w100p">
        <label class="heading">Upscaler</label>
        <select class="sel-upscaler"></select>
      </div>
      <div class="option w50p">
        <span class="chk-upscaler-2"></span>
      </div>
      <div class="option w50p">
        <label class="heading">Visibility</label>
        <input type="number" class="txt-upscaler-2-visibility" value="0" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
      </div>
      <div class="option w100p">
        <label class="heading">Upscaler 2</label>
        <select class="sel-upscaler-2"></select>
      </div>
      <div class="option w50p">
        <label class="heading">CodeFormer Visibility</label>
        <input type="number" class="txt-codeformer-visibility" value="0" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
      </div>
      <div class="option w50p">
        <label class="heading">CodeFormer Weight</label>
        <input type="number" class="txt-codeformer-weight" value="0" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
      </div>
      <div class="option w50p">
        <span class="chk-upscale-first"></span>
      </div>
      <div class="option w50p">
        <label class="heading">GFPGAN Visibility</label>
        <input type="number" class="txt-gfpgan-visibility" value="0" min="0" max="1" step="0.1" onchange="validateInputRange(this)">
      </div>
      <div class="option w100p">
        <button type="button" class="btn-show-result" title="Show result image"><span>SHOW RESULT</span></button>
      </div>
    </div>
  </div>
  <div class="output-wrapper w100p" style="display: none">
    <img class="output-image" alt="Upscaled image">
  </div>
</div>
`;

const css = /*css*/ `
#upscale-tab {
  position: relative;
}

#upscale-tab .panes {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  max-width: 512px;
}

@media (min-width: 720px) {
  #upscale-tab .panes {
    max-width: 1024px;
  }
  #upscale-tab .pane {
    width: 50%;
    max-width: 50%;
  }
}

#upscale-tab .pane {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
}

#upscale-tab .input-wrapper {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
}

#upscale-tab .input-image-file {
  color: transparent;
  width: 100%;
  padding: 1rem;
  border: 1px solid #ffffff;
  border-radius: 0.5rem;
}

#upscale-tab .input-image-file::before {
  display: block;
  width: 100%;
  height: 0;
  content: 'Select or drag PNG';
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  text-align: center;
  vertical-align: middle;
  color: #ffffff;
}

#upscale-tab .input-image-file::-webkit-file-upload-button {
  visibility: hidden;
}

#upscale-tab .input-image {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

#upscale-tab .option {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
}

#upscale-tab .heading {
  font-size: 0.9rem;
}

#upscale-tab .btn-upscale,
#upscale-tab .btn-show-result {
  width: 100%;
}

#upscale-tab input[type=text],
#upscale-tab input[type=number],
#upscale-tab select {
  flex-grow: 1;
  min-width: 0;
}

#upscale-tab input[type=text]:disabled,
#upscale-tab input[type=number]:disabled,
#upscale-tab select:disabled {
  color: hsla(0, 0%, 100%, 0.3);
}

#upscale-tab .output-wrapper {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: hsla(0, 0%, 0%, 0.5);
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
}

#upscale-tab .output-image {
  max-width: min(512px, calc(100vw - 3rem));
  max-height: min(512px, 80vh);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
}
`;

export default class Upscale extends Tab {
  /** @type {HTMLInputElement} */
  inputImageFile;
  /** @type {HTMLImageElement} */
  inputImage;
  /** @type {Checkbox} */
  scaleByCheckbox;
  /** @type {HTMLInputElement} */
  scaleBy;
  /** @type {HTMLInputElement} */
  scaleWidth;
  /** @type {HTMLInputElement} */
  scaleHeight;
  /** @type {HTMLSelectElement} */
  upscaler;
  /** @type {Checkbox} */
  upscaler2Checkbox;
  /** @type {HTMLInputElement} */
  upscaler2Visibility;
  /** @type {HTMLSelectElement} */
  upscaler2;
  /** @type {HTMLInputElement} */
  codeFormerVisibility;
  /** @type {HTMLInputElement} */
  codeFormerWeight;
  /** @type {Checkbox} */
  upscaleFirst;
  /** @type {HTMLInputElement} */
  gfpganVisibility;

  /** @type {HTMLButtonElement} */
  upscaleButton;
  /** @type {HTMLButtonElement} */
  showResultButton;

  /** @type {HTMLElement} */
  outputWrapper;
  /** @type {HTMLImageElement} */
  outputImage;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html, css);
    this.title = 'UPSCALE';

    this.inputImageFile = this.root.querySelector('.input-image-file');
    this.inputImageFile.addEventListener('change', () => {
      if (this.inputImageFile.files.length == 0) return;
      const file = this.inputImageFile.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        this.inputImage.src = reader.result;
        this.inputImage.style.display = '';
        if (this.showResultButton.style.display == '') {
          this.showResultButton.querySelector('span').innerText = 'SHOW OLD RESULT';
        }
      });
      reader.readAsDataURL(file);
    });
    this.inputImage = this.root.querySelector('.input-image');
    this.scaleByCheckbox = new Checkbox(
      this.root.querySelector('.chk-scale-by'),
      { assignedId: 'chk-scale-by', label: 'Scale By', extraClasses: ['w100p'] },
      true
    );
    this.scaleBy = this.root.querySelector('.txt-scale-by');
    this.scaleWidth = this.root.querySelector('.txt-scale-width');
    this.scaleHeight = this.root.querySelector('.txt-scale-height');

    this.scaleByCheckbox.onChange = (chk) => {
      this.scaleBy.disabled = !chk.checked;
      this.scaleWidth.disabled = chk.checked;
      this.scaleHeight.disabled = chk.checked;
    };
    this.scaleByCheckbox.checked = true;
    this.scaleBy.disabled = false;
    this.scaleWidth.disabled = true;
    this.scaleHeight.disabled = true;

    this.upscaler = this.root.querySelector('.sel-upscaler');
    this.upscaler2Checkbox = new Checkbox(
      this.root.querySelector('.chk-upscaler-2'),
      { assignedId: 'chk-upscaler-2', label: 'Upscaler 2', extraClasses: ['w100p'] },
      true
    );
    this.upscaler2Visibility = this.root.querySelector('.txt-upscaler-2-visibility');
    this.upscaler2 = this.root.querySelector('.sel-upscaler-2');

    this.upscaler2Checkbox.onChange = (chk) => {
      this.upscaler2Visibility.disabled = !chk.checked;
      this.upscaler2.disabled = !chk.checked;
    };
    this.upscaler2Checkbox.checked = false;
    this.upscaler2Visibility.disabled = true;
    this.upscaler2.disabled = true;

    this.codeFormerVisibility = this.root.querySelector('.txt-codeformer-visibility');
    this.codeFormerWeight = this.root.querySelector('.txt-codeformer-weight');
    this.upscaleFirst = new Checkbox(
      this.root.querySelector('.chk-upscale-first'),
      { assignedId: 'chk-upscale-first', label: 'Upscale First', extraClasses: ['w100p'] },
      true
    );
    this.gfpganVisibility = this.root.querySelector('.txt-gfpgan-visibility');

    this.upscaleButton = this.root.querySelector('.btn-upscale');

    this.outputWrapper = this.root.querySelector('.output-wrapper');
    this.outputImage = this.root.querySelector('.output-image');

    this.upscaleButton.addEventListener('click', () => {
      this.upscale();
    });

    this.showResultButton = this.root.querySelector('.btn-show-result');
    this.showResultButton.parentElement.style.display = 'none';
    this.showResultButton.addEventListener('click', () => {
      this.outputWrapper.style.display = '';
    });

    this.outputWrapper.addEventListener('click', (e) => {
      if (e.target == this.outputWrapper) {
        this.outputWrapper.style.display = 'none';
        e.stopPropagation();
      }
    });

    AppConfig.instance.upscalerList.forEach((s) => {
      this.upscaler.appendChild(
        Object.assign(document.createElement('option'), {
          value: s,
          innerText: s,
        })
      );
      this.upscaler2.appendChild(
        Object.assign(document.createElement('option'), {
          value: s,
          innerText: s,
        })
      );
    });
  }

  async upscale() {
    if (this.inputImage.src == '') return;
    const inputImageData = this.inputImage.src;
    this.setLoading(true);
    Api.instance
      .upscale({
        resize_mode: this.scaleByCheckbox.checked ? 0 : 1,
        gfpgan_visibility: this.gfpganVisibility.valueAsNumber,
        codeformer_visibility: this.codeFormerVisibility.valueAsNumber,
        codeformer_weight: this.codeFormerWeight.valueAsNumber,
        upscaling_resize: this.scaleBy.valueAsNumber,
        upscaling_resize_w: this.scaleWidth.valueAsNumber,
        upscaling_resize_h: this.scaleHeight.valueAsNumber,
        upscaler_1: this.upscaler.value,
        upscaler_2: this.upscaler2.value,
        extras_upscaler_2_visibility: this.upscaler2Visibility.valueAsNumber,
        upscaleFirst: this.upscaleFirst.checked,
        image: inputImageData,
      })
      .then((json) => {
        const imageData = json.image;
        this.outputImage.src = 'data:image/png;base64,' + imageData;
        this.outputWrapper.style.display = '';
        this.showResultButton.parentElement.style.display = '';
        this.showResultButton.querySelector('span').innerText = 'SHOW RESULT';
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        this.setLoading(false);
      });
  }

  retrieveImage(imageData) {
    this.inputImage.src = imageData;
    this.inputImage.style.display = '';
    if (this.showResultButton.style.display == '') {
      this.showResultButton.querySelector('span').innerText = 'SHOW OLD RESULT';
    }
  }

  setLoading(isLoading) {
    this.inputImageFile.disabled = isLoading;
    this.scaleByCheckbox.disabled = isLoading;
    this.scaleBy.disabled = isLoading || !this.scaleByCheckbox.checked;
    this.scaleWidth.disabled = isLoading || this.scaleByCheckbox.checked;
    this.scaleHeight.disabled = isLoading || this.scaleByCheckbox.checked;
    this.upscaler.disabled = isLoading;
    this.upscaler2Checkbox.disabled = isLoading;
    this.upscaler2Visibility.disabled = isLoading || !this.upscaler2Checkbox.checked;
    this.upscaler2.disabled = isLoading || !this.upscaler2Checkbox.checked;
    this.codeFormerVisibility.disabled = isLoading;
    this.codeFormerWeight.disabled = isLoading;
    this.upscaleFirst.disabled = isLoading;
    this.gfpganVisibility.disabled = isLoading;
    this.upscaleButton.disabled = isLoading;
    this.showResultButton.disabled = isLoading;
  }
}
