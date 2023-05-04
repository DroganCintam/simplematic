import Component from './component.mjs';

const html = /*html*/ `
<div class="image-upload">
  <input type="file" accept="image/png">
  <img alt="Input image" style="display: none">
</div>
`;

const css = /*css*/ `
.image-upload {
  margin: 0;
  padding: 0;
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
  display: flex;
}

.image-upload input[type="file"] {
  color: transparent;
  width: 100%;
  height: 100%;
  padding: 1rem;
  border-radius: 0.5rem;
}

.image-upload input[type="file"]::before {
  display: block;
  width: 100%;
  height: 0;
  content: 'Select or drag PNG';
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  text-align: center;
  color: #ffffff;
}

.image-upload input[type="file"]::-webkit-file-upload-button {
  visibility: hidden;
}

.image-upload img {
  width: 100%;
  border-radius: 0.5rem;
  cursor: pointer;
}
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

  get acceptedTypes() {
    return this.fileInput.accept;
  }

  set acceptedTypes(value) {
    this.fileInput.accept = value;
  }

  /**
   * @param {HTMLElement} parent
   * @param {{ extraClasses: string[] | undefined }} options
   * @param {boolean} replacing
   */
  constructor(parent, options, replacing = true) {
    super(parent, html, css, replacing);

    if (options.extraClasses) {
      this.root.classList.add(options.extraClasses);
    }
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
