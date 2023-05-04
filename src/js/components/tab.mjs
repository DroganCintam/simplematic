import Component from './component.mjs';

export default class Tab extends Component {
  title = '';

  /**
   * @param {HTMLElement} parent
   * @param {string} html
   * @param {string} css
   */
  constructor(parent, html, css) {
    super(parent, html, css);
  }

  show() {
    this.root.style.display = '';
  }

  hide() {
    this.root.style.display = 'none';
  }
}
