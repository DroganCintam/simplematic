import Component from './component.mjs';

const html = /*html*/ `
<footer>
  <span>an app by Cintam</span>
  <div class="buttons">
    <a href="https://ko-fi.com/cintam" target="_blank" title="buy me a coffee"><img src="/img/ko-fi.png"></a>
  </div>
</footer>
`;

const css = /*css*/ `
footer {
  height: 4rem;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  padding: 0 1rem;
  gap: 1rem;
  font-weight: bold;
  font-size: 0.75rem;
  color: hsla(0, 0%, 100%, 0.8);
  border-top: 1px solid hsla(0, 0%, 100%, 0.25);
}

footer .buttons {
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

footer .buttons a {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
}

footer .buttons a img {
  width: 1.5rem;
  height: 1.5rem;
}
`;

export default class Footer extends Component {
  constructor(parent) {
    super(parent, html, css, true);
  }
}
