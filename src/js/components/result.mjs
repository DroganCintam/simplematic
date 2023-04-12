import Tab from './tab.mjs';
import ImageInfo from '../types/image-info.mjs';
import autoResize from '../utils/autoResize.mjs';
import friendlyModelNames from '../types/friendly-model-names.mjs';
import PngInfo from '../types/png-info.mjs';
import { ImageDB, ImageDataItemCursor } from '../types/image-db.mjs';
import Progress from './progress.mjs';
import extractPngText from '../utils/extractPngText.mjs';

const html = /*html*/ `
<div id="result-tab" class="app-tab" style="display: none">
  <div class="panes">
    <div class="pane image-pane">
      <div class="vertical w100p no-gap" style="position: relative">
        <img class="image"/>
      </div>
    </div>
    <div class="pane info-pane">
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
      <div class="horizontal w100p actions">
        <button type="button" class="btn-remix"><img src="/img/flask-solid.svg">REMIX</button>
        <button type="button" class="btn-rerun"><p></p><img src="/img/wand-magic-sparkles-solid.svg"><span>NEW SEED</span></button>
        <button type="button" class="btn-save"><img src="/img/floppy-disk-solid.svg">SAVE</button>
        <button type="button" class="btn-delete"><img src="/img/trash-solid.svg">DELETE</button>
      </div>
      <div class="tagging">
        <label class="heading">Tags:</label>
        <div class="tags">
          <div class="tag"><span>#general</span><span class="btn-remove-tag"></span></div>
          <div class="tag"><span>#nature</span><span class="btn-remove-tag"></span></div>
          <div class="tag"><span>#test</span><span class="btn-remove-tag"></span></div>
          <div class="add-tag">
            <span class="hash">#</span>
            <input type="text" class="txt-tag" autocapitalize="off">
            <button type="button" class="btn-add-tag" title="Add tag"><img src="/img/plus-solid.svg"></button>
          </div>
        </div>
      </div>
      <div class="vertical w100p">
        <label class="heading">Prompt:</label>
        <textarea class="result-prompt" readonly></textarea>
      </div>
      <div class="vertical w100p">
        <label class="heading">Negative prompt:</label>
        <textarea class="result-negative-prompt" readonly></textarea>
      </div>
      <div class="vertical w50p">
        <label class="heading">Steps:</label>
        <input type="text" class="result-steps" readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">CFG:</label>
        <input type="text" class="result-cfg" readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Seed:</label>
        <input type="text" class="result-seed" readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Sampler:</label>
        <input type="text" class="result-sampler" readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Model name:</label>
        <input type="text" class="result-model-name" readonly />
      </div>
      <div class="vertical w50p">
        <label class="heading">Model hash:</label>
        <input type="text" class="result-model-hash" readonly />
      </div>
      <div class="vertical w100p">
        <label class="heading">Parameters:</label>
        <textarea class="result-parameters" readonly></textarea>
      </div>
    </div>
  </div>

  <style>
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

    #result-tab .actions button {
      font-size: 0.75rem;
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

    #result-tab .tagging {
      width: 100%;
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: 0.5rem;
    }

    #result-tab .tagging .tags {
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: 0.5rem;
    }

    #result-tab .tagging .tags .tag {
      padding: 0.5rem;
      background-color: hsla(0, 0%, 0%, 0.5);
      color: hsla(0, 0%, 100%, 1);
      border-radius: 0.5rem;
      font-size: 0.8rem;
    }

    #result-tab .tagging .tags .tag .btn-remove-tag {
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

    #result-tab .tagging .tags .tag .btn-remove-tag:hover {
      opacity: 1;
    }

    #result-tab .tagging .tags .add-tag {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
    }

    #result-tab .tagging .tags .add-tag .hash {
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

    #result-tab .tagging .tags .add-tag input {
      border: 1px solid hsla(0, 0%, 100%, 0.25);
      border-left: none;
      padding-left: 0.25rem;
      max-width: 12ch;
      border-radius: 0;
      height: 2rem;
    }
    
    #result-tab .tagging .tags .add-tag button {
      border: 1px solid hsla(0, 0%, 100%, 0.25);
      border-radius: 0 0.5rem 0.5rem 0;
      background-color: hsla(0, 0%, 0%, 1);
      height: 2rem;
    }

    #result-tab .tagging .tags .add-tag button:hover {
      background-color: hsla(0, 0%, 30%, 1);
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
  /** @type {HTMLTextAreaElement} */
  parameters;

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
    this.parameters = this.root.querySelector('.result-parameters');

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

    this.deleteButton = this.root.querySelector('.btn-delete');
    this.deleteButton.addEventListener('click', () => {
      if (!ImageDB.instance.has(this.imageInfo.uuid)) return;
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
    });

    this.tagging = this.root.querySelector('.tagging');
    this.tags = this.tagging.querySelector('.tags');
    this.tagElements = [];

    this.tagToAdd = this.tagging.querySelector('.txt-tag');
    this.tagToAdd.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
        e.preventDefault();
        this.addTagButton.click();
      } else if (/[0-9A-Za-z_-]/.test(e.key) == false) {
        e.preventDefault();
      }
    });

    this.addTagButton = this.tagging.querySelector('.btn-add-tag');
    this.addTagButton.addEventListener('click', () => {
      this.addTag();
    });
  }

  display(json) {
    const infoText = JSON.parse(json.info).infotexts[0];
    this.imageInfo = new ImageInfo(json.images[0], infoText);
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
    this.parameters.value = infoText;

    this.setImageAspectRatio();

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
    this.parameters.value = infoText;

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
    this.prevImageButton.parentElement.style.display = 'none';

    this.populateTags();
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
    this.parameters.value = extractPngText(row.data.substring('data:image/png;base64,'.length));

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
    this.prevImageButton.parentElement.style.display = '';

    this.populateTags(row.tags ?? []);
  }

  resizePromptBoxes() {
    autoResize(this.prompt);
    autoResize(this.negativePrompt);
    autoResize(this.parameters);
  }

  setImageAspectRatio() {
    if (this.imageInfo.info.width > this.imageInfo.info.height) {
      this.image.classList.remove('square');
      this.image.classList.remove('portrait');
      this.image.classList.add('landscape');
    } else if (this.imageInfo.info.height > this.imageInfo.info.width) {
      this.image.classList.remove('landscape');
      this.image.classList.remove('square');
      this.image.classList.add('portrait');
    } else {
      this.image.classList.remove('landscape');
      this.image.classList.remove('portrait');
      this.image.classList.add('square');
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
    const button = Object.assign(document.createElement('span'), {
      className: 'btn-remove-tag',
    });
    button.addEventListener('click', () => {
      if (this.addTagButton.disabled == false) {
        this.removeTag(el, tag);
      }
    });
    el.appendChild(name);
    el.appendChild(button);
    this.tags.insertBefore(el, this.tags.querySelector('.add-tag'));
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
      this.tags.removeChild(element);
    });
  }

  setLoading(isLoading) {
    this.remixButton.disabled = isLoading;
    this.rerunButton.disabled = isLoading;
    this.saveButton.disabled = isLoading;
    this.deleteButton.disabled = isLoading;
    this.addTagButton.disabled = isLoading;
  }
}
