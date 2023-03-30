import Tab from './tab.mjs';
import ImageInfo from '../types/image-info.mjs';
import autoResize from '../utils/autoResize.mjs';
import friendlyModelNames from '../types/friendly-model-names.mjs';
import PngInfo from '../types/png-info.mjs';
import { ImageDB, ImageDataItemCursor } from '../types/image-db.mjs';
import Progress from './progress.mjs';

const html = /*html*/ `
<div id="result-tab" class="app-tab" style="display: none">
  <div>
    <div class="vertical w100p no-gap" style="position: relative">
      <img class="image"/>
      <div class="image-navigation">
        <button type="button" class="btn-prev" style="display: none">
          <img src="/img/chevron-left-solid.svg" alt="Previous image"/>
          PREV
        </button>
        <button type="button" class="btn-next" style="display: none">
          NEXT
          <img src="/img/chevron-right-solid.svg" alt="Next image"/>
        </button>
      </div>
    </div>
    <div class="horizontal w100p">
      <button type="button" class="btn-remix">REMIX</button>
      <button type="button" class="btn-rerun"><p></p><span>RERUN</span></button>
      <button type="button" class="btn-save"><img src="/img/floppy-disk-solid.svg"></button>
      <button type="button" class="btn-delete"><img src="/img/trash-solid.svg"></button>
    </div>
    <div class="vertical w100p">
      <label>Prompt:</label>
      <textarea class="result-prompt" readonly></textarea>
    </div>
    <div class="vertical w100p">
      <label>Negative prompt:</label>
      <textarea class="result-negative-prompt" readonly></textarea>
    </div>
    <div class="vertical w50p">
      <label>Steps:</label>
      <input type="text" class="result-steps" readonly />
    </div>
    <div class="vertical w50p">
      <label>CFG:</label>
      <input type="text" class="result-cfg" readonly />
    </div>
    <div class="vertical w100p">
      <label>Seed:</label>
      <input type="text" class="result-seed" readonly />
    </div>
    <div class="vertical w100p">
      <label>Sampler:</label>
      <input type="text" class="result-sampler" readonly />
    </div>
    <div class="vertical w100p">
      <label>Model name:</label>
      <input type="text" class="result-model-name" readonly />
    </div>
    <div class="vertical w100p">
      <label>Model hash:</label>
      <input type="text" class="result-model-hash" readonly />
    </div>
  </div>

  <style>
    #result-tab > div {
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      justify-content: flex-start;
      width: 100%;
      max-width: 512px;
    }

    #result-tab > div > div {
      margin: 0;
      padding: 0.5rem;
      display: flex;
      align-items: flex-start;
    }

    #result-tab > div > div.vertical {
      flex-flow: column nowrap;
      justify-content: flex-start;
      row-gap: 0.5rem;
    }

    #result-tab > div > div.horizontal {
      flex-flow: row nowrap;
      justify-content: stretch;
      column-gap: 0.25rem;
    }

    #result-tab > div > div.horizontal > * {
      flex-grow: 1;
    }

    #result-tab > div > div.no-gap {
      gap: 0;
    }

    #result-tab .image {
      width: 100%;
      border: 1px solid #ffffff;
      border-radius: 0.5rem;
    }

    #result-tab .image.square {
      max-width: 512px;
      max-height: 512px;
    }

    #result-tab .image.portrait {
      max-width: 512px;
      max-height: 768px;
    }

    #result-tab .image.landscape {
      max-width: 768px;
      max-height: 512px;
    }

    #result-tab textarea {
      width: 100%;
      max-width: 512px;
    }

    #result-tab textarea,
    #result-tab input {
      padding: 0.5rem;
      background-color: rgba(0, 0, 0, 0.5);
      color: hsl(0, 0%, 100%);
      font-family: 'Montserrat';
      font-size: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 0.5rem;
      resize: none;
      outline: none;
    }

    #result-tab input[type=text] {
      width: 100%;
    }

    #result-tab .image-navigation {
      display: flex;
      flex-flow: row nowrap;
      justify-content: stretch;
      align-items: center;
      width: 100%;
      height: auto;
    }

    #result-tab .image-navigation button {
      background: none;
      border: 0;
      font-size: 0.75rem;
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      align-items: center;
      column-gap: 0.5rem;
      color: hsla(0, 0%, 100%, 1);
    }

    #result-tab .image-navigation button:disabled {
      color: hsla(0, 0%, 100%, 0.5);
    }

    #result-tab .image-navigation button img {
      width: 1rem;
      height: 1rem;
    }

    #result-tab .btn-prev,
    #result-tab .btn-next {
      flex-grow: 1;
    }
  </style>

</div>
`;

export default class ResultDialog extends Tab {
  /** @type {HTMLImageElement} */
  image;
  /** @type {HTMLButtonElement} */
  prevImageButton;
  /** @type {HTMLButtonElement} */
  nextImageButton;

  /** @type {HTMLButtonElement} */
  remixButton;
  /** @type {HTMLButtonElement} */
  rerunButton;
  /** @type {Progress} */
  rerunProgress;

  /** @type {HTMLButtonElement} */
  saveButton;
  /** @type {HTMLButtonElement} */
  deleteButton;

  /** @type {HTMLTextAreaElement} */
  prompt;
  /** @type {HTMLTextAreaElement} */
  negativePrompt;
  /** @type {HTMLInputElement} */
  steps;
  /** @type {HTMLInputElement} */
  cfg;
  /** @type {HTMLInputElement} */
  seed;
  /** @type {HTMLInputElement} */
  samplerName;
  /** @type {HTMLInputElement} */
  modelName;
  /** @type {HTMLInputElement} */
  modelHash;

  /** @type {ImageInfo} */
  imageInfo;

  fromGallery = false;

  /** @type {(info: ImageInfo, progress: Progress) => void} */
  onRerun;
  /** @type {(info: ImageInfo) => void} */
  onRemix;

  /** @type {() => void} */
  goPrev;
  /** @type {() => void} */
  goNext;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html);
    this.image = this.root.querySelector('.image');
    this.prompt = this.root.querySelector('.result-prompt');
    this.negativePrompt = this.root.querySelector('.result-negative-prompt');
    this.steps = this.root.querySelector('.result-steps');
    this.cfg = this.root.querySelector('.result-cfg');
    this.seed = this.root.querySelector('.result-seed');
    this.samplerName = this.root.querySelector('.result-sampler');
    this.modelName = this.root.querySelector('.result-model-name');
    this.modelHash = this.root.querySelector('.result-model-hash');

    this.prevImageButton = this.root.querySelector('.btn-prev');
    this.prevImageButton.addEventListener('click', () => {
      if (this.goPrev) this.goPrev();
    });

    this.nextImageButton = this.root.querySelector('.btn-next');
    this.nextImageButton.addEventListener('click', () => {
      if (this.goNext) this.goNext();
    });

    this.remixButton = this.root.querySelector('.btn-remix');
    this.remixButton.addEventListener('click', () => {
      this.onRemix(this.imageInfo);
    });

    this.rerunButton = this.root.querySelector('.btn-rerun');
    this.rerunButton.addEventListener('click', () => {
      this.onRerun(this.imageInfo, this.rerunProgress);
    });
    this.rerunProgress = new Progress(this.rerunButton.querySelector('p'), true);

    this.saveButton = this.root.querySelector('.btn-save');
    this.saveButton.addEventListener('click', () => {
      if (ImageDB.instance.has(this.imageInfo.uuid)) return;
      this.setLoading(true);
      ImageDB.instance
        .add(this.imageInfo)
        .then((result) => {
          this.imageInfo.saved = true;
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          this.setLoading(false);
          if (this.imageInfo.saved) {
            this.saveButton.style.display = 'none';
            this.deleteButton.style.display = '';
          }
        });
    });

    this.deleteButton = this.root.querySelector('.btn-delete');
    this.deleteButton.addEventListener('click', () => {
      if (!ImageDB.instance.has(this.imageInfo.uuid)) return;
      this.setLoading(true);
      ImageDB.instance
        .remove(this.imageInfo.uuid)
        .then((result) => {
          this.imageInfo.saved = false;
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          this.setLoading(false);
          if (!this.imageInfo.saved) {
            this.saveButton.style.display = '';
            this.deleteButton.style.display = 'none';
          }
        });
    });
  }

  display(json) {
    this.imageInfo = new ImageInfo(json.images[0], JSON.parse(json.info).infotexts[0]);
    this.image.src = this.imageInfo.imageData;
    this.image.title = this.imageInfo.info.prompt;
    this.prompt.value = this.imageInfo.info.prompt;
    this.negativePrompt.value = this.imageInfo.info.negativePrompt;
    this.steps.value = this.imageInfo.info.steps;
    this.cfg.value = this.imageInfo.info.cfg;
    this.seed.value = this.imageInfo.info.seed;
    this.samplerName.value = this.imageInfo.info.sampler;
    this.modelName.value =
      friendlyModelNames[this.imageInfo.info.modelHash] ?? this.imageInfo.info.modelName;
    this.modelHash.value = this.imageInfo.info.modelHash;

    this.setImageAspectRatio();

    this.title = 'RESULT';
    this.fromGallery = false;

    this.saveButton.style.display = '';
    this.deleteButton.style.display = 'none';

    this.goPrev = null;
    this.goNext = null;

    this.prevImageButton.style.display = 'none';
    this.nextImageButton.style.display = 'none';
  }

  /**
   * @param {string} imageData
   * @param {string} infoText
   */
  displayLoaded(imageData, infoText) {
    this.imageInfo = new ImageInfo(imageData, infoText);
    this.imageInfo.imported = true;
    this.image.src = this.imageInfo.imageData;
    this.image.title = this.imageInfo.info.prompt;
    this.prompt.value = this.imageInfo.info.prompt;
    this.negativePrompt.value = this.imageInfo.info.negativePrompt;
    this.steps.value = this.imageInfo.info.steps;
    this.cfg.value = this.imageInfo.info.cfg;
    this.seed.value = this.imageInfo.info.seed;
    this.samplerName.value = this.imageInfo.info.sampler;
    this.modelName.value =
      friendlyModelNames[this.imageInfo.info.modelHash] ?? this.imageInfo.info.modelName;
    this.modelHash.value = this.imageInfo.info.modelHash;

    this.setImageAspectRatio();

    this.title = 'IMPORTED RESULT';
    this.fromGallery = false;

    if (this.imageInfo.saved) {
      this.saveButton.style.display = 'none';
      this.deleteButton.style.display = '';
    } else {
      this.saveButton.style.display = '';
      this.deleteButton.style.display = 'none';
    }

    this.goPrev = null;
    this.goNext = null;

    this.prevImageButton.style.display = 'none';
    this.nextImageButton.style.display = 'none';
  }

  /**
   * @param {ImageDataItemCursor} idic
   */
  displaySaved(idic) {
    const row = idic.value;
    this.imageInfo = new ImageInfo();
    this.imageInfo.uuid = row.uuid;
    this.imageInfo.imageData = row.data;
    this.imageInfo.timestamp = row.timestamp;
    this.imageInfo.imported = row.imported;
    this.imageInfo.info = new PngInfo();
    Object.assign(this.imageInfo.info, row);
    delete this.imageInfo.info['uuid'];
    delete this.imageInfo.info['data'];
    delete this.imageInfo.info['timestamp'];
    delete this.imageInfo.info['imported'];
    delete this.imageInfo.info['tags'];

    this.imageInfo.imported = true;
    this.image.src = this.imageInfo.imageData;
    this.image.title = this.imageInfo.info.prompt;
    this.prompt.value = this.imageInfo.info.prompt;
    this.negativePrompt.value = this.imageInfo.info.negativePrompt;
    this.steps.value = this.imageInfo.info.steps;
    this.cfg.value = this.imageInfo.info.cfg;
    this.seed.value = this.imageInfo.info.seed;
    this.samplerName.value = this.imageInfo.info.sampler;
    this.modelName.value =
      friendlyModelNames[this.imageInfo.info.modelHash] ?? this.imageInfo.info.modelName;
    this.modelHash.value = this.imageInfo.info.modelHash;

    this.setImageAspectRatio();

    this.title = 'SAVED IMAGE';
    this.fromGallery = true;

    this.saveButton.style.display = 'none';
    this.deleteButton.style.display = '';

    const onPrev = idic.prev
      ? () => {
          this.displaySaved(idic.prev);
          this.resizePromptBoxes();
        }
      : null;

    const onNext = idic.next
      ? () => {
          this.displaySaved(idic.next);
          this.resizePromptBoxes();
        }
      : null;

    this.goPrev = onPrev;
    this.goNext = onNext;

    this.prevImageButton.style.display = '';
    this.prevImageButton.disabled = !onPrev;
    this.nextImageButton.style.display = '';
    this.nextImageButton.disabled = !onNext;
  }

  resizePromptBoxes() {
    autoResize(this.prompt);
    autoResize(this.negativePrompt);
  }

  setImageAspectRatio() {
    if (this.imageInfo.info.width == 768) {
      this.image.classList.remove('square');
      this.image.classList.remove('portrait');
      this.image.classList.add('landscape');
    } else if (this.imageInfo.info.height == 768) {
      this.image.classList.remove('landscape');
      this.image.classList.remove('square');
      this.image.classList.add('portrait');
    } else {
      this.image.classList.remove('landscape');
      this.image.classList.remove('portrait');
      this.image.classList.add('square');
    }
  }

  setLoading(isLoading) {
    this.remixButton.disabled = isLoading;
    this.rerunButton.disabled = isLoading;
    this.saveButton.disabled = isLoading;
    this.deleteButton.disabled = isLoading;
  }
}