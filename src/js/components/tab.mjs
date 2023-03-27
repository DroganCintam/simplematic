import Component from './component.mjs';

export default class Tab extends Component {
  title = '';

  /**
   * @param {HTMLElement} parent
   * @param {string} html
   */
  constructor(parent, html) {
    super(parent, html);
  }

  show() {
    this.root.style.display = '';
  }

  hide() {
    this.root.style.display = 'none';
  }
}
