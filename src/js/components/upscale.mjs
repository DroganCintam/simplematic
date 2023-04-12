import Checkbox from './checkbox.mjs';
import Tab from './tab.mjs';

const html = /*html*/ `
<div id="upscale-tab" class="app-tab" style="display:none">
  <div>
    <div class="input-wrapper w100p">
      <input class="input-image-file" type="file" accept="image/png">
      <img class="input-image" alt="Input image" style="display: none">
    </div>
    <div class="option w50p">
      <span class="chk-scale-by"></span>
    </div>
    <div class="option w50p">
      <label class="heading">Scale by</label>
      <input type="number" class="txt-scale-by" value="4" min="1" max="8" onchange="validateInputRange(this)">
    </div>
    <div class="option w50p">
      <label class="heading">Width</label>
      <input type="number" class="txt-scale-width" value="512" min="1" onchange="validateInputRange(this)">
    </div>
    <div class="option w50p">
      <label class="heading">Height</label>
      <input type="number" class="txt-scale-height" value="512" min="1" onchange="validateInputRange(this)">
    </div>
  </div>

  <style>
    #upscale-tab > div {
      width: 100%;
      max-width: 1024px;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
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
      height: 0;
      padding: 1rem;
      border: 1px solid #ffffff;
      border-radius: 0.5rem;
    }

    #upscale-tab .input-image-file::before {
      display: block;
      width: 100%;
      height: 4rem;
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

    #upscale-tab .option {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
    }

    #upscale-tab input[type=text],
    #upscale-tab input[type=number],
    #upscale-tab select {
      flex-grow: 1;
    }

    #upscale-tab input[type=text]:disabled,
    #upscale-tab input[type=number]:disabled,
    #upscale-tab select:disabled {
      color: hsla(0, 0%, 100%, 0.3);
    }
  </style>
</div>
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

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html);
    this.title = 'UPSCALE';

    this.inputImageFile = this.root.querySelector('.input-image-file');
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
  }
}
