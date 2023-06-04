import Tab from './tab.mjs';
import version from '../version.mjs';

const html = /*html*/ `
<div id="changelog-tab" class="app-tab" style="display:none">
  <div>
    <p>Current version: <code data-current-version></code></p>
    <h1>Version 0.6.2</h1>
    <ul>
      <li>Inpainting</li>
      <li>Prompt clipboard</li>
      <li>LORA, Textual Inversion and Script auto-fill lists</li>
      <li>Several bugfixes</li>
    </ul>
    <h1>Version 0.6.1</h1>
    <ul>
      <li>Support for scripts</li>
      <li>Custom image sizes</li>
      <li>Customizable app background</li>
      <li>Confirm dialogs for some destructive actions</li>
      <li>Keyboard shortcuts</li>
      <li>This Changelog page</li>
    </ul>
    <h1>Version 0.6.0</h1>
    <ul>
      <li>Img2Img</li>
      <li>Pagination in Gallery</li>
      <li>Some bugfixes</li>
    </ul>
  </div>
</div>
`;

const css = /*css*/ `
#changelog-tab {
  background-color: hsla(0, 0%, 0%, 0.5);
  min-height: calc(100vh - 7rem);
  font-size: 0.8rem;
}

#changelog-tab > div {
  max-width: 640px;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  row-gap: 1rem;
}

#changelog-tab p {
  margin: 0;
  padding: 0;
  line-height: 150%;
  font-size: 1rem;
}

#changelog-tab h1 {
  margin: 0;
  padding: 0;
  line-height: 150%;
  font-size: 1.25em;
  font-weight: bold;
}

#changelog-tab a, #changelog-tab a:visited {
  text-decoration: underline;
  color: #ffffff;
}

#changelog-tab a:hover {
  color: hsl(35 67% 50%);
}

#changelog-tab code {
  color: hsl(75 67% 60%);
}

#changelog-tab ul {
  margin: 0;
  padding: 0 0 0 1.5rem;
}

#changelog-tab li {
  padding: 0.25rem 0;
}
`;

export default class Changelog extends Tab {
  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html, css);
    this.title = 'CHANGELOG';
    this.root.querySelector('[data-current-version]').innerText = version.version;
  }
}
