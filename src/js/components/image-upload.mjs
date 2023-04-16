import Component from './component.mjs';

const html = /*html*/ `
<div class="image-upload">
  <input type="file" accept="image/png">
  <img alt="Input image" style="display: none">
</div>
`;

export default class ImageUpload extends Component {
  /** @type {HTMLInputElement} */
  fileInput;
  /** @type {HTMLImageElement} */
  image;

  _disabled = false;

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this.fileInput.disabled = value;
  }

  /**
   * @param {HTMLElement} parent
   * @param {{ extraClasses: string[] | undefined }}} options
   * @param {boolean} replacing
   */
  constructor(parent, options, replacing = true) {
    super(parent, html, replacing);

    this.fileInput = this.root.querySelector('input');
    this.image = this.root.querySelector('img');

    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files.length == 0) return;
      const file = this.fileInput.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        this.image.src = reader.result;
        this.image.style.display = '';
        this.fileInput.style.display = 'none';
      });
      reader.readAsDataURL(file);
    });

    this.image.addEventListener('click', () => {
      if (this._disabled) return;
      this.fileInput.click();
    });
  }

  get hasImage() {
    return this.image.src != '';
  }

  get imageData() {
    return this.image.src;
  }

  set imageData(data) {
    this.image.src = data;
    if (data && data !== '') {
      this.image.style.display = '';
      this.fileInput.style.display = 'none';
    } else {
      this.image.style.display = 'none';
      this.fileInput.style.display = '';
    }
  }
}
