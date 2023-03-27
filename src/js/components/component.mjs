export default class Component {
  /** @type {HTMLElement} */
  root;

  /**
   * @param {HTMLElement} parent The HTML element to be used as parent or to be replaced.
   * @param {string} html The HTML string to parse into elements.
   * @param {boolean} replacing Replace the given element with this.
   */
  constructor(parent, html, replacing = false) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    this.root = doc.body.firstChild;
    if (replacing) {
      parent.parentElement.replaceChild(this.root, parent);
    } else {
      parent.appendChild(this.root);
    }
  }
}
