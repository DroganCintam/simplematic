import Tab from './tab.mjs';
import ImageInfo from '../types/image-info.mjs';
import autoResize from '../utils/autoResize.mjs';
import friendlyModelNames from '../types/friendly-model-names.mjs';
import PngInfo from '../types/png-info.mjs';
import { ImageDB, ImageDataItemCursor } from '../types/image-db.mjs';
import Progress from './progress.mjs';
import extractPngText from '../utils/extractPngText.mjs';
import ConfirmDialog from './confirm-dialog.mjs';

const html = /*html*/ `
<div id="result-tab" class="app-tab" style="display: none">
  <div class="panes">
    <div class="pane image-pane">
      <div class="vertical w100p no-gap" style="position: relative">
        <div data-input-image-wrapper>
          <img data-input-image/>
          <span>INPUT IMAGE</span>
        </div>
        <img data-image/>
        <button type="button" data-btn-input-image style="display: none" title="Show/hide input image">
          <img src="/img/images-solid.svg"/>
        </button>
      </div>
    </div>
    <div class="pane info-pane">
      <div class="image-navigation">
        <button type="button" data-btn-prev style="display: none" title="Previous image">
          <img src="/img/chevron-left-solid.svg"/>
          PREV
        </button>
        <button type="button" data-btn-next style="display: none" title="Next image">
          NEXT
          <img src="/img/chevron-right-solid.svg"/>
        </button>
      </div>
      <div class="horizontal w100p actions">
        <button type="button" data-btn-remix title="Copy all parameters"><img src="/img/flask-solid.svg">REMIX</button>
        <button type="button" data-btn-rerun title="Re-generate with a new seed"><p></p><img src="/img/wand-magic-sparkles-solid.svg"><span>NEW SEED</span></button>
        <button type="button" data-btn-save title="Save to gallery"><img src="/img/floppy-disk-solid.svg">SAVE</button>
        <button type="button" data-btn-delete title="Delete from gallery"><img src="/img/trash-solid.svg">DELETE</button>
        <button type="button" data-btn-download title="Download this image"><img src="/img/download-solid.svg">DOWNLOAD</button>
        <button type="button" data-btn-upscale title="Upscale this"><img src="/img/up-right-and-down-left-from-center-solid-black.svg">UPSCALE</button>
        <button type="button" data-btn-img2img title="Use this as img2img input"><img src="/img/images-solid.svg">IMG2IMG</button>
      </div>
      <div data-tagging>
        <label class="heading">Tags:</label>
        <div data-tags>
          <div data-add-tag>
            <span class="hash">#</span>
            <input type="text" data-txt-tag autocapitalize="off">
            <button type="button" data-btn-add-tag title="Add tag"><img src="/img/plus-solid.svg"></button>
          </div>
        </div>
      </div>
      <div class="vertical w100p">
        <label class="heading">Prompt:</label>
        <textarea data-result-prompt readonly></textarea>
      </div>
      <div class="vertical w100p">
        <label class="heading">Negative prompt:</label>
        <textarea data-result-negative-prompt readonly></textarea>
      </div>
      <div class="vertical w50p">
        <label class="heading">Width:</label>
        <input type="text" data-result-width readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Height:</label>
        <input type="text" data-result-height readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Steps:</label>
        <input type="text" data-result-steps readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">CFG:</label>
        <input type="text" data-result-cfg readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Seed:</label>
        <input type="text" data-result-seed readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Sampler:</label>
        <input type="text" data-result-sampler readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Model name:</label>
        <input type="text" data-result-model-name readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Model hash:</label>
        <input type="text" data-result-model-hash readonly />
      </div>
      <div class="vertical w100p">
        <label class="heading">Parameters:</label>
        <textarea data-result-parameters readonly></textarea>
      </div>
      <div class="vertical w100p" data-script-info>
        <label class="heading">Script name:</label>
        <input type="text" data-result-script-name readonly />
      </div>
      <div class="vertical w100p" data-script-info>
        <label class="heading">Script arguments:</label>
        <input type="text" data-result-script-args readonly />
      </div>
      <div class="vertical w100p" data-result-timestamp>
        <label>Timestamp:</label>
        <input type="text" readonly />
      </div>
    </div>
  </div>
</div>
`;

const css = /*css*/ `
#result-tab .panes {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  max-width: 512px;
}

@media (min-width: 720px) {
  #result-tab .panes {
    max-width: 1024px;
  }
  #result-tab .pane {
    width: 50%;
    max-width: 50%;
  }
}

#result-tab .pane {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
}

#result-tab .pane > div {
  margin: 0;
  padding: 0.5rem;
  display: flex;
  align-items: flex-start;
}

#result-tab .pane > div.vertical {
  flex-flow: column nowrap;
  justify-content: flex-start;
  row-gap: 0.5rem;
}

#result-tab .pane > div.horizontal {
  flex-flow: row nowrap;
  justify-content: stretch;
  column-gap: 0.25rem;
}

#result-tab .pane > div.horizontal > * {
  flex-grow: 1;
}

#result-tab .pane > div.no-gap {
  gap: 0;
}

#result-tab .actions {
  flex-flow: row wrap !important;
  gap: 0.25rem;
}

#result-tab .actions button {
  font-size: 0.75rem;
}

#result-tab [data-image] {
  width: 100%;
  height: auto;
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
  position: relative;
}

#result-tab [data-input-image-wrapper] {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  padding: 0.5rem;
}

#result-tab [data-input-image] {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.5rem;
}

#result-tab [data-input-image-wrapper] span {
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  bottom: 0.5rem;
  border-radius: 0 0 0.5rem 0.5rem;
  text-align: center;
  background-color: hsla(0, 0%, 0%, 0.5);
  color: hsl(0, 0%, 100%);
  padding: 0.5rem;
}

#result-tab [data-btn-input-image] {
  position: absolute;
  right: 1rem;
  top: 1rem;
}

#result-tab textarea {
  width: 100%;
  max-width: 512px;
}

#result-tab input[type=text],
#result-tab input[type=number],
#result-tab textarea {
  width: 100%;
  color: hsl(0, 0%, 90%);
}

#result-tab input[type=text],
#result-tab input[type=number],
#result-tab textarea {
  font-size: 0.8rem;
}

#result-tab [data-result-script-name],
#result-tab [data-result-script-args] {
  font-family: monospace;
}

#result-tab .image-navigation {
  align-items: center;
  width: 100%;
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

@supports not (-webkit-touch-callout: none) {
  #result-tab .image-navigation button:hover {
    background-color: hsla(0, 0%, 100%, 0.5);
  }
}

#result-tab .image-navigation button:disabled {
  color: hsla(0, 0%, 100%, 0.5);
}

#result-tab .image-navigation button:disabled:hover {
  background: none;
}

#result-tab .image-navigation button img {
  width: 1rem;
  height: 1rem;
}

#result-tab [data-btn-prev],
#result-tab [data-btn-next] {
  flex-grow: 1;
}

#result-tab [data-tagging] {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
}

#result-tab [data-tagging] [data-tags] {
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
}

#result-tab [data-tagging] [data-tags] .tag {
  padding: 0.5rem;
  background-color: hsla(0, 0%, 0%, 0.5);
  color: hsla(0, 0%, 100%, 1);
  border-radius: 0.5rem;
  font-size: 0.8rem;
}

#result-tab [data-tagging] [data-tags] .tag [data-btn-remove-tag] {
  content: 'x';
  width: 1rem;
  height: 1rem;
  margin-left: 0.5rem;
  display: inline-block;
  vertical-align: middle;
  background-image: url('/img/xmark-solid.svg');
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  opacity: 0.5;
}

#result-tab [data-tagging] [data-tags] .tag [data-btn-remove-tag]:hover {
  opacity: 1;
}

#result-tab [data-tagging] [data-tags] [data-add-tag] {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
}

#result-tab [data-tagging] [data-tags] [data-add-tag] .hash {
  border: 1px solid hsla(0, 0%, 100%, 0.25);
  border-right: none;
  border-radius: 0.5rem 0 0 0.5rem;
  height: 2rem;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
  font-size: 0.8rem;
  color: hsla(0, 0%, 100%, 0.75);
}

#result-tab [data-tagging] [data-tags] [data-add-tag] input {
  border: 1px solid hsla(0, 0%, 100%, 0.25);
  border-left: none;
  padding-left: 0.25rem;
  max-width: 12ch;
  border-radius: 0;
  height: 2rem;
}

#result-tab [data-tagging] [data-tags] [data-add-tag] button {
  border: 1px solid hsla(0, 0%, 100%, 0.25);
  border-radius: 0 0.5rem 0.5rem 0;
  background-color: hsla(0, 0%, 0%, 1);
  height: 2rem;
}

#result-tab [data-tagging] [data-tags] [data-add-tag] button:hover {
  background-color: hsla(0, 0%, 30%, 1);
}
`;

export default class ResultDialog extends Tab {
  /** @type {HTMLImageElement} */
  image;
  /** @type {HTMLButtonElement} */
  prevImageButton;
  /** @type {HTMLButtonElement} */
  nextImageButton;

  /** @type {HTMLElement} */
  inputImageWrapper;
  /** @type {HTMLImageElement} */
  inputImage;
  /** @type {HTMLButtonElement} */
  inputImageButton;

  /** @type {HTMLButtonElement} */
  remixButton;
  /** @type {HTMLButtonElement} */
  rerunButton;
  /** @type {Progress} */
  rerunProgress;

  /** @type {HTMLButtonElement} */
  downloadButton;
  /** @type {HTMLButtonElement} */
  upscaleButton;
  /** @type {HTMLButtonElement} */
  img2imgButton;

  /** @type {HTMLElement} */
  tagging;
  /** @type {HTMLElement} */
  tags;
  /** @type {Array<HTMLElement>} */
  tagElements;
  /** @type {HTMLInputElement} */
  tagToAdd;
  /** @type {HTMLButtonElement} */
  addTagButton;

  /** @type {HTMLButtonElement} */
  saveButton;
  /** @type {HTMLButtonElement} */
  deleteButton;

  /** @type {HTMLElement} */
  timestamp;

  /** @type {HTMLTextAreaElement} */
  prompt;
  /** @type {HTMLTextAreaElement} */
  negativePrompt;
  /** @type {HTMLInputElement} */
  width;
  /** @type {HTMLInputElement} */
  height;
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
  /** @type {HTMLTextAreaElement} */
  parameters;

  /** @type {HTMLInputElement} */
  scriptName;
  /** @type {HTMLInputElement} */
  scriptArgs;

  /** @type {ImageInfo} */
  imageInfo;

  fromGeneration = false;
  fromGallery = false;

  /** @type {(info: ImageInfo, progress: Progress, fromSameWork: boolean) => void} */
  onRerun;
  /** @type {(info: ImageInfo, fromSameWork: boolean) => void} */
  onRemix;
  /** @type {(info: ImageInfo) => void} */
  onUpscale;
  /** @type {(info: ImageInfo) => void} */
  onImg2Img;

  /** @type {() => void} */
  goPrev;
  /** @type {() => void} */
  goNext;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html, css);
    this.image = this.root.querySelector('[data-image]');
    this.timestamp = this.root.querySelector('[data-result-timestamp]');
    this.prompt = this.root.querySelector('[data-result-prompt]');
    this.negativePrompt = this.root.querySelector('[data-result-negative-prompt]');
    this.width = this.root.querySelector('[data-result-width]');
    this.height = this.root.querySelector('[data-result-height]');
    this.steps = this.root.querySelector('[data-result-steps]');
    this.cfg = this.root.querySelector('[data-result-cfg]');
    this.seed = this.root.querySelector('[data-result-seed]');
    this.samplerName = this.root.querySelector('[data-result-sampler]');
    this.modelName = this.root.querySelector('[data-result-model-name]');
    this.modelHash = this.root.querySelector('[data-result-model-hash]');
    this.parameters = this.root.querySelector('[data-result-parameters]');
    this.scriptName = this.root.querySelector('[data-result-script-name]');
    this.scriptArgs = this.root.querySelector('[data-result-script-args]');

    this.prevImageButton = this.root.querySelector('[data-btn-prev]');
    this.prevImageButton.addEventListener('click', () => {
      if (this.goPrev) this.goPrev();
    });

    this.nextImageButton = this.root.querySelector('[data-btn-next]');
    this.nextImageButton.addEventListener('click', () => {
      if (this.goNext) this.goNext();
    });

    this.inputImageWrapper = this.root.querySelector('[data-input-image-wrapper]');
    this.inputImage = this.root.querySelector('[data-input-image]');
    this.inputImageButton = this.root.querySelector('[data-btn-input-image]');
    this.inputImageButton.addEventListener('click', () => {
      this.toggleInputImage(this.inputImage.style.display === 'none');
    });

    this.remixButton = this.root.querySelector('[data-btn-remix]');
    this.remixButton.addEventListener('click', () => {
      this.onRemix(this.imageInfo, this.fromGeneration);
    });

    this.rerunButton = this.root.querySelector('[data-btn-rerun]');
    this.rerunButton.addEventListener('click', () => {
      this.onRerun(this.imageInfo, this.rerunProgress, this.fromGeneration);
    });
    this.rerunProgress = new Progress(this.rerunButton.querySelector('p'), true);

    this.downloadButton = this.root.querySelector('[data-btn-download]');
    this.downloadButton.addEventListener('click', () => {
      this.downloadImage();
    });

    this.upscaleButton = this.root.querySelector('[data-btn-upscale]');
    this.upscaleButton.addEventListener('click', () => {
      this.onUpscale(this.imageInfo);
    });

    this.img2imgButton = this.root.querySelector('[data-btn-img2img]');
    this.img2imgButton.addEventListener('click', () => {
      this.onImg2Img(this.imageInfo);
    });

    this.saveButton = this.root.querySelector('[data-btn-save]');
    this.saveButton.addEventListener('click', () => {
      if (ImageDB.instance.has(this.imageInfo.uuid)) return;
      this.setLoading(true);
      ImageDB.instance
        .add(this.imageInfo)
        .then((result) => {
          this.imageInfo.saved = true;
          const tags = ImageDB.instance.get(this.imageInfo.uuid).value.tags;
          this.populateTags(tags ?? []);
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

    this.deleteButton = this.root.querySelector('[data-btn-delete]');
    this.deleteButton.addEventListener('click', () => {
      if (!ImageDB.instance.has(this.imageInfo.uuid)) return;
      ConfirmDialog.instance.show(
        'The image will be removed from the Gallery and its hashtags will be cleared.\nAre you sure?',
        () => {
          this.setLoading(true);
          ImageDB.instance
            .remove(this.imageInfo.uuid)
            .then((result) => {
              this.imageInfo.saved = false;
              this.populateTags();
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
        }
      );
    });

    this.tagging = this.root.querySelector('[data-tagging]');
    this.tags = this.tagging.querySelector('[data-tags]');
    this.tagElements = [];

    this.tagToAdd = this.tagging.querySelector('[data-txt-tag]');
    this.tagToAdd.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
        e.preventDefault();
        this.addTagButton.click();
      } else if (/[0-9A-Za-z_-]/.test(e.key) == false) {
        e.preventDefault();
      }
    });

    this.addTagButton = this.tagging.querySelector('[data-btn-add-tag]');
    this.addTagButton.addEventListener('click', () => {
      this.addTag();
    });

    this.image.addEventListener('load', () => {
      const width = this.image.naturalWidth;
      const height = this.image.naturalHeight;
      this.width.value = width;
      this.height.value = height;
    });
  }

  /**
   * @param {any} json
   * @param {string} inputImage
   * @param {number} inputResizeMode
   * @param {string | undefined} scriptName
   * @param {string | undefined} scriptArgs
   */
  display(json, inputImage, inputResizeMode, scriptName, scriptArgs) {
    const infoText = JSON.parse(json.info).infotexts[0];
    this.imageInfo = new ImageInfo(json.images[0], infoText);
    this.image.src = this.imageInfo.imageData;
    this.image.title = this.imageInfo.info.prompt;
    this.prompt.value = this.imageInfo.info.prompt;
    this.negativePrompt.value = this.imageInfo.info.negativePrompt;
    this.width.value = this.imageInfo.info.width.toString();
    this.height.value = this.imageInfo.info.height.toString();
    this.steps.value = this.imageInfo.info.steps;
    this.cfg.value = this.imageInfo.info.cfg;
    this.seed.value = this.imageInfo.info.seed;
    this.samplerName.value = this.imageInfo.info.sampler;
    this.modelName.value =
      friendlyModelNames[this.imageInfo.info.modelHash] ?? this.imageInfo.info.modelName;
    this.modelHash.value = this.imageInfo.info.modelHash;
    this.parameters.value = infoText;

    this.title = 'RESULT';
    this.fromGallery = false;

    this.saveButton.style.display = '';
    this.deleteButton.style.display = 'none';

    this.goPrev = null;
    this.goNext = null;

    this.prevImageButton.style.display = 'none';
    this.nextImageButton.style.display = 'none';
    this.prevImageButton.parentElement.style.display = 'none';

    this.populateTags();

    if (inputImage && inputImage !== '') {
      this.imageInfo.inputImage = inputImage;
      this.imageInfo.inputResizeMode = inputResizeMode;
      this.inputImage.src = inputImage;
      this.inputImageButton.style.display = '';
      this.updateInputResizeMode();
    } else {
      this.inputImageButton.style.display = 'none';
    }
    this.toggleInputImage(false);

    this.imageInfo.scriptName = scriptName;
    this.imageInfo.scriptArgs = scriptArgs;
    this.updateScript();

    this.fromGeneration = true;

    this.timestamp.style.display = 'none';
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
    this.width.value = this.imageInfo.info.width.toString();
    this.height.value = this.imageInfo.info.height.toString();
    this.steps.value = this.imageInfo.info.steps;
    this.cfg.value = this.imageInfo.info.cfg;
    this.seed.value = this.imageInfo.info.seed;
    this.samplerName.value = this.imageInfo.info.sampler;
    this.modelName.value =
      friendlyModelNames[this.imageInfo.info.modelHash] ?? this.imageInfo.info.modelName;
    this.modelHash.value = this.imageInfo.info.modelHash;
    this.parameters.value = infoText;

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
    this.prevImageButton.parentElement.style.display = 'none';

    this.populateTags();

    this.inputImageButton.style.display = 'none';
    this.toggleInputImage(false);

    this.updateScript();

    this.fromGeneration = false;
    this.timestamp.style.display = 'none';
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
    this.width.value = this.imageInfo.info.width.toString();
    this.height.value = this.imageInfo.info.height.toString();
    this.steps.value = this.imageInfo.info.steps;
    this.cfg.value = this.imageInfo.info.cfg;
    this.seed.value = this.imageInfo.info.seed;
    this.samplerName.value = this.imageInfo.info.sampler;
    this.modelName.value =
      friendlyModelNames[this.imageInfo.info.modelHash] ?? this.imageInfo.info.modelName;
    this.modelHash.value = this.imageInfo.info.modelHash;
    this.parameters.value = extractPngText(row.data.substring('data:image/png;base64,'.length));

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
    this.prevImageButton.parentElement.style.display = '';

    this.populateTags(row.tags ?? []);

    if (row.inputImage && row.inputImage !== '') {
      this.imageInfo.inputImage = row.inputImage;
      this.imageInfo.inputResizeMode = row.inputResizeMode;
      this.inputImage.src = idic.value.inputImage;
      this.inputImageButton.style.display = '';
      this.updateInputResizeMode();
    } else {
      this.inputImageButton.style.display = 'none';
    }
    this.toggleInputImage(false);

    this.imageInfo.scriptName = row.scriptName;
    this.imageInfo.scriptArgs = row.scriptArgs;
    this.updateScript();

    this.fromGeneration = false;
    this.timestamp.style.display = 'flex';
    this.timestamp.querySelector('input').value = row.timestamp.toLocaleString();
  }

  resizePromptBoxes() {
    autoResize(this.prompt);
    autoResize(this.negativePrompt);
    autoResize(this.parameters);
  }

  toggleInputImage(isShowing) {
    if (isShowing) {
      this.inputImage.style.display = '';
      this.inputImage.nextElementSibling.style.display = '';
      this.inputImageButton.classList.add('showing');
      this.image.style.visibility = 'hidden';
    } else {
      this.inputImage.style.display = 'none';
      this.inputImage.nextElementSibling.style.display = 'none';
      this.inputImageButton.classList.remove('showing');
      this.image.style.visibility = '';
    }
  }

  updateInputResizeMode() {
    switch (this.imageInfo.inputResizeMode) {
      case 0:
        this.inputImage.style.objectFit = 'fill';
        break;
      case 1:
        this.inputImage.style.objectFit = 'cover';
        break;
      case 2:
        this.inputImage.style.objectFit = 'contain';
        break;
    }
  }

  updateScript() {
    if (this.imageInfo.scriptName) {
      this.root.querySelectorAll('[data-script-info]').forEach((el) => {
        el.style.display = '';
      });
      this.scriptName.value = this.imageInfo.scriptName;
      this.scriptArgs.value = this.imageInfo.scriptArgs;
    } else {
      this.root.querySelectorAll('[data-script-info]').forEach((el) => {
        el.style.display = 'none';
      });
    }
  }

  /**
   * @param {Array<string> | undefined} tags
   */
  populateTags(tags) {
    while (true) {
      const el = this.tags.querySelector('.tag');
      if (el) {
        this.tags.removeChild(el);
      } else {
        break;
      }
    }
    this.tagElements = [];
    if (!tags) {
      this.tagging.style.display = 'none';
    } else {
      this.tagging.style.display = '';
      tags.forEach(this.appendTag.bind(this));
    }
  }

  appendTag(tag) {
    const el = Object.assign(document.createElement('div'), {
      className: 'tag',
    });
    const name = Object.assign(document.createElement('span'), {
      innerText: '#' + tag,
    });
    const button = Object.assign(document.createElement('span'));
    button.setAttribute('data-btn-remove-tag', '');
    button.addEventListener('click', () => {
      if (this.addTagButton.disabled == false) {
        this.removeTag(el, tag);
      }
    });
    el.appendChild(name);
    el.appendChild(button);
    this.tags.insertBefore(el, this.tags.querySelector('[data-add-tag]'));
  }

  addTag() {
    const tag = this.tagToAdd.value.trim();
    if (tag != '') {
      ImageDB.instance.addTag(this.imageInfo.uuid, tag).then((isAdded) => {
        if (isAdded) {
          this.appendTag(tag);
          this.tagToAdd.value = '';
          this.tagToAdd.focus();
        }
      });
    }
  }

  /**
   * @param {HTMLElement} element
   * @param {string} tag
   */
  removeTag(element, tag) {
    ImageDB.instance.removeTag(this.imageInfo.uuid, tag).then((isRemoved) => {
      if (isRemoved) {
        this.tags.removeChild(element);
      }
    });
  }

  downloadImage() {
    const link = document.createElement('a');
    link.href = this.image.src;
    link.download = `image-${new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '-')
      .slice(0, -5)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  setLoading(isLoading) {
    this.prevImageButton.disabled = isLoading || !this.goPrev;
    this.nextImageButton.disabled = isLoading || !this.goNext;
    this.inputImageButton.disabled = isLoading;
    this.remixButton.disabled = isLoading;
    this.rerunButton.disabled = isLoading;
    this.saveButton.disabled = isLoading;
    this.deleteButton.disabled = isLoading;
    this.downloadButton.disabled = isLoading;
    this.upscaleButton.disabled = isLoading;
    this.img2imgButton.disabled = isLoading;
    this.addTagButton.disabled = isLoading;
  }
}
