import Component from './component.mjs';

const html = /*html*/ `
<div class="top-bar">
  <div style="display: flex; flex-flow: row nowrap; column-gap: 0.25rem">
    <button type="button" class="icon-button" data-btn-menu title="Menu">
      <img src="img/bars-solid.svg" />
    </button>
    <button
      type="button"
      class="icon-button" data-btn-back
      title="Go back"
      style="display: none"
    >
      <img src="img/angle-left-solid.svg" />
    </button>
    <button
      type="button"
      class="icon-button" data-btn-result
      style="display: none"
      title="Result image (Ctrl+I)"
    >
      <img src="img/image-solid.svg" />
    </button>
    <button type="button" class="icon-button" data-btn-png-import title="Import PNG">
      <img src="img/file-import-solid.svg" />
    </button>
    <button
      type="button"
      class="icon-button" data-btn-gallery
      title="Gallery"
      style="display: none"
    >
      <img src="img/grip-solid.svg" />
    </button>
  </div>
  <span data-tab-title></span>
  <button type="button" data-btn-generate>
    <p></p>
    <img src="/img/wand-magic-sparkles-solid.svg" />
    <span>GENERATE</span>
  </button>
</div>
`;

const css = /*css*/ `
.top-bar {
  margin: 0;
  padding: 0 1rem;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 4rem;
  z-index: 888;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  background-color: hsla(0, 0%, 0%, 0.3);
  transition: left 0.2s ease-out;
}

.top-bar.opaque {
  background-color: hsla(0, 0%, 0%, 1);
}
`;

export default class TopBar extends Component {
  /** @type {HTMLButtonElement} */
  menuButton;
  /** @type {HTMLButtonElement} */
  backButton;
  /** @type {HTMLButtonElement} */
  resultButton;
  /** @type {HTMLButtonElement} */
  importButton;
  /** @type {HTMLButtonElement} */
  galleryButton;
  /** @type {HTMLButtonElement} */
  generateButton;

  /** @type {HTMLSpanElement} */
  tabTitle;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html, css, true);

    this.menuButton = this.root.querySelector('[data-btn-menu]');
    this.backButton = this.root.querySelector('[data-btn-back]');
    this.resultButton = this.root.querySelector('[data-btn-result]');
    this.importButton = this.root.querySelector('[data-btn-png-import]');
    this.galleryButton = this.root.querySelector('[data-btn-gallery]');
    this.generateButton = this.root.querySelector('[data-btn-generate]');
    this.tabTitle = this.root.querySelector('[data-tab-title]');
  }
}
