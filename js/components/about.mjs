import Tab from './tab.mjs';

const html = /*html*/ `
<div id="about-tab" class="app-tab" style="display:none">
  <div>
    <h1>Overview</h1>
    <p>This web app provides a simplified interface for
      using Stable Diffusion, utilizing the API of
      <a href="https://github.com/AUTOMATIC1111/stable-diffusion-webui" target="_blank">
        AUTOMATIC1111's Stable Diffusion Web UI</a>.</p>
    <p>The purpose is to deliver a watered-down feature set,
      making life easier for beginners and anyone who is
      looking for a cleaner and simpler interface.</p>
    <h1>Setup</h1>
    <p>This app requires a running instance of AUTOMATIC1111's
      Web UI. The following command line arguments are necessary:</p>
    <ul>
      <li><code>--api</code>: to enable API requests.</li>
      <li><code>--share</code>: to create a Gradio public URL.
      <li>OR <code>--ngrok your_ngrok_token</code>: to establish a tunnel
      using <a href="https://ngrok.com" target="_blank">ngrok</a> service.
      (Not sponsored.)</li>
      <li><code>--cors-allow-origins=https://simplematic.web.app</code>:
      to allow requests from this app.</li>
    </ul>
    <p>You might want to add <code>--ngrok-region</code> to optimize
      connection speed. See their <a href="https://ngrok.com/docs/platform/pops/" target="_blank">docs</a> for more details.</p>
    <p>Also, you can add <code>--api-auth username:password</code> to
      add a basic authorization layer. Furthermore, add <code>--no-webui</code>
      to completely prevent other parties from using your instance. But
      that also means you won't be able to use the Web UI either.</p>
    <p>When the Web UI instance is ready, copy the provided Gradio or ngrok
      link and paste it into the URL input in Settings screen. Enter username
      and password if any, then click <b>SAVE</b>. If the setup is correct,
      the app will connect to your instance and start fetching models
      as well as sampler list.</p>
    <h1>About me</h1>
    <p>My name's Cintam. I code to make a living and do arts to have a life.
      I made this app to learn AI and other coding stuffs.
    </p>
  </div>

  <style>
    #about-tab {
      background-color: hsla(0, 0%, 0%, 0.5);
      min-height: calc(100vh - 7rem);
      font-size: 0.8rem;
    }

    #about-tab > div {
      max-width: 640px;
      width: 100%;
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: flex-start;
      row-gap: 1rem;
    }

    #about-tab p {
      margin: 0;
      padding: 0;
      line-height: 150%;
    }

    #about-tab h1 {
      margin: 0;
      padding: 0;
      line-height: 150%;
      font-size: 1.25em;
      font-weight: bold;
    }

    #about-tab a, #about-tab a:visited {
      text-decoration: underline;
      color: #ffffff;
    }

    #about-tab a:hover {
      color: hsl(35 67% 50%);
    }

    #about-tab code {
      color: hsl(75 67% 60%);
    }

    #about-tab ul {
      margin: 0;
      padding: 0 0 0 1.5rem;
    }

    #about-tab li {
      padding: 0.25rem 0;
    }
  </style>
</div>
`;

export default class About extends Tab {
  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html);
    this.title = 'ABOUT';
  }
}
