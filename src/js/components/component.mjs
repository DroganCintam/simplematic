import StylePool from '../style-pool.mjs';

export default class Component {
  /** @type {HTMLElement} */
  root;

  /**
   * @param {HTMLElement} parent The HTML element to be used as parent or to be replaced.
   * @param {string} html The HTML string to parse into elements.
   * @param {string} css The CSS styles for the component.
   * @param {boolean} replacing Replace the given element with this.
   */
  constructor(parent, html, css, replacing = false) {
    this.root = Component.fromHTML(html);
    if (replacing) {
      parent.parentElement.replaceChild(this.root, parent);
    } else {
      parent.appendChild(this.root);
    }
    StylePool.instance.addStyles(this.constructor.name, css);
  }

  /**
   *
   * @param {string} html
   * @returns {HTMLElement}
   */
  static fromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.firstChild;
  }

  /**
   * @param {HTMLElement} el
   * @param {HTMLElement} newParent
   */
  static changeParent(el, newParent) {
    el.parentElement.removeChild(el);
    newParent.appendChild(el);
  }

  /**
   * @param {any} type
   * @param {EventListenerOrEventListenerObject} listener
   */
  addEventListener(type, listener) {
    this.root.addEventListener(type, listener);
  }

  /**
   * @param {Event} event
   * @returns {boolean}
   */
  dispatchEvent(event) {
    return this.root.dispatchEvent(event);
  }
}
