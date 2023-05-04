export default class StylePool {
  /** @type {StylePool} */
  static _instance;
  /** @type {StylePool} */
  static get instance() {
    if (!StylePool._instance) {
      StylePool._instance = new StylePool();
    }
    return StylePool._instance;
  }

  /** @type {HTMLStyleElement} */
  styleTag;

  /** @type {Object<string, string>} */
  styleDict = {};

  constructor() {
    this.styleTag = document.createElement('style');
    document.head.appendChild(this.styleTag);
  }

  /**
   * @param {string} id Unique identifier for the style set
   * @param {string} css CSS code for the style set
   */
  addStyles(id, css) {
    if (typeof this.styleDict[id] === 'undefined') {
      this.styleTag.textContent += css;
      this.styleDict[id] = css;
    }
  }
}
