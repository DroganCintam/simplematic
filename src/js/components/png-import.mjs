import PngInfo from '../types/png-info.mjs';
import autoResize from '../utils/autoResize.mjs';
import readPngText from '../utils/readPngText.mjs';
import Tab from './tab.mjs';

const html = /*html*/ `
<div id="png-import-tab" class="app-tab" style="display: none">
  <div>
    <div>
      <label class="heading">Import as file:</label>
      <input class="file-input" type="file" accept="image/png">
      <span class="invalid-file-message" style="display:none">The provided file does not contain parameters data.</span>
    </div>
    <div>
      <label class="heading">Import as parameters:<span class="options">
      <button class="icon-button btn-clear-parameters" title="Erase">
        <img src="/img/eraser-solid.svg"/>
      </button>
    </span></label>
      <textarea class="parameters-input"></textarea>
      <span class="invalid-parameters-message" style="display:none">The provided parameters are invalid.</span>
    </div>
    <div>
      <button class="btn-import-parameters"><img src="/img/file-import-solid-black.svg">IMPORT PARAMETERS</button>
    </div>
  </div>
</div>
`;

const css = /*css*/ `
#png-import-tab > div {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  max-width: 512px;
}

#png-import-tab > div > div {
  width: 100%;
  margin: 0;
  padding: 0.5rem;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  row-gap: 0.5rem;
}

#png-import-tab .file-input {
  color: transparent;
  width: 100%;
  padding: 1rem;
  border: 1px solid #ffffff;
  border-radius: 0.5rem;
}

#png-import-tab .file-input::before {
  display: block;
  width: 100%;
  height: 100%;
  content: 'Select or drag PNG';
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  text-align: center;
  vertical-align: middle;
  color: #ffffff;
}

#png-import-tab .file-input::-webkit-file-upload-button {
  visibility: hidden;
}

#png-import-tab .parameters-input {
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: hsl(0, 0%, 100%);
  font-family: 'Montserrat';
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 0.5rem;
  resize: none;
  outline: none;
  width: 100%;
}

#png-import-tab .btn-import-parameters {
  width: 100%;
}

#png-import-tab label.heading {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
}

#png-import-tab label.heading .options {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
}
`;

export default class PngImport extends Tab {
  /** @type {HTMLInputElement} */
  pngFile;
  /** @type {HTMLSpanElement} */
  invalidPngError;
  /** @type {HTMLTextAreaElement} */
  parametersInput;
  /** @type {HTMLButtonElement} */
  clearParametersButton;
  /** @type {HTMLSpanElement} */
  invalidParametersError;

  /** @type {HTMLButtonElement} */
  importParametersButton;

  /** @type {(imageData: string, infoText: string) => void} */
  onLoaded;

  /** @type {(pngInfo: PngInfo) => void} */
  onParameters;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html, css);
    this.title = 'IMPORT PNG';

    this.pngFile = this.root.querySelector('.file-input');
    this.invalidPngError = this.root.querySelector('.invalid-file-message');
    this.parametersInput = this.root.querySelector('.parameters-input');
    this.clearParametersButton = this.root.querySelector('.btn-clear-parameters');
    this.invalidParametersError = this.root.querySelector('.invalid-parameters-message');
    this.importParametersButton = this.root.querySelector('.btn-import-parameters');

    this.pngFile.addEventListener('change', (e) => {
      if (this.pngFile.files.length == 0) return;
      const file = this.pngFile.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const view = new DataView(reader.result);
        let offset = 8;

        let hasParameters = false;
        while (offset < view.byteLength) {
          const length = view.getUint32(offset);
          offset += 4;
          const type = view.getUint32(offset);
          offset += 4;

          // 'tEXt'
          if (type === 0x74455874) {
            const text = new TextDecoder().decode(
              new Uint8Array(reader.result.slice(offset, offset + length))
            );
            const chunks = text.split('\0');
            for (let i = 0; i < chunks.length - 1; i += 2) {
              const key = chunks[i];
              if (key === 'parameters') {
                const imageData = PngImport.arrayBufferToBase64(reader.result);
                const infoText = chunks[i + 1];
                this.pngFile.value = '';
                hasParameters = true;
                this.onLoaded(imageData, infoText);
                break;
              }
            }
            break;
          }

          offset += length + 4;
        }

        this.invalidPngError.style.display = hasParameters ? 'none' : '';
      });
      reader.readAsArrayBuffer(file);
    });

    this.parametersInput.addEventListener('input', function () {
      autoResize(this);
    });

    this.clearParametersButton.addEventListener('click', () => {
      this.parametersInput.value = '';
    });

    this.importParametersButton.addEventListener('click', () => {
      const info = readPngText(this.parametersInput.value);
      if (
        info.steps > 0 &&
        info.sampler != '' &&
        info.width > 0 &&
        info.height > 0 &&
        info.modelHash != ''
      ) {
        if (info.seed == 0) info.seed = -1;
        this.invalidParametersError.style.display = 'none';
        this.onParameters(info);
      } else {
        this.invalidParametersError.style.display = '';
      }
    });
  }

  static arrayBufferToBase64(arrayBuffer) {
    var binary = '';
    var bytes = new Uint8Array(arrayBuffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
