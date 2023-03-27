import PngInfo from '../types/png-info.mjs';
import readPngText from '../utils/readPngText.mjs';
import Tab from './tab.mjs';

const html = /*html*/ `
<div id="png-import-tab" class="app-tab" style="display: none">
  <div>
    <div>
      <input class="file-input" type="file" accept="image/png">
      <span class="invalid-file-message" style="display:none">The provided file does not contain parameters data.</span>
    </div>
  </div>

  <style>
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
  </style>
</div>
`;

export default class PngImport extends Tab {
  /** @type {HTMLInputElement} */
  pngFile;
  /** @type {HTMLSpanElement} */
  invalidPngError;

  /** @type {(imageData: string, infoText: string) => void} */
  onLoaded;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html);
    this.title = 'IMPORT PNG';

    this.pngFile = this.root.querySelector('.file-input');
    this.invalidPngError = this.root.querySelector('.invalid-file-message');

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
