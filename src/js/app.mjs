import Menu from './components/menu.mjs';
import Settings from './components/settings.mjs';
import Result from './components/result.mjs';
import Txt2Img from './components/txt2img.mjs';
import Tab from './components/tab.mjs';
import Api from './api.mjs';
import AppConfig from './types/app-config.mjs';
import PngImport from './components/png-import.mjs';
import About from './components/about.mjs';
import Gallery from './components/gallery.mjs';
import Progress from './components/progress.mjs';

class App {
  /** @type {HTMLElement} */
  root;

  /** @type {Menu} */
  menu;
  /** @type {HTMLElement} */
  mainView;
  /** @type {HTMLElement} */
  mainCurtain;

  /** @type {HTMLButtonElement} */
  menuButton;
  /** @type {HTMLButtonElement} */
  resultButton;
  /** @type {HTMLButtonElement} */
  backButton;
  /** @type {HTMLButtonElement} */
  pngImportButton;

  /** @type {HTMLSpanElement} */
  tabTitle;
  /** @type {HTMLButtonElement} */
  generateButton;
  /** @type {HTMLSpanElement} */
  generateButtonText;

  /** @type {Progress} */
  generationProgress;

  /** @type {Settings} */
  settingsTab;

  /** @type {About} */
  aboutTab;

  /** @type {Result} */
  resultTab;

  /** @type {PngImport} */
  pngImportTab;

  /** @type {Txt2Img} */
  txt2imgTab;

  /** @type {Gallery} */
  galleryTab;

  /** @type {Tab} */
  currentTab;

  showingMenu = false;
  menuWidth = 'min(20rem, 100vw - 4rem)';

  hasResult = false;

  initialize() {
    Api.instance.baseUrl = AppConfig.instance.apiUrl;

    this.root = document.querySelector('#app');
    this.mainView = this.root.querySelector('.main-view');
    this.mainCurtain = this.root.querySelector('.main-curtain');

    this.mainCurtain.addEventListener('click', () => {
      if (this.showingMenu && !this.menu.hideMenuButton.disabled) {
        this.hideMenu();
      }
    });

    this.menu = new Menu(this.root.querySelector('.menu'));
    this.menu.onHide = this.hideMenu.bind(this);
    this.menu.onOpenGallery = () => this.switchTab(this.galleryTab);
    this.menu.onSettings = () => this.switchTab(this.settingsTab);
    this.menu.onAbout = () => this.switchTab(this.aboutTab);

    const topBar = this.root.querySelector('.top-bar');
    this.mainView.addEventListener('scroll', () => {
      if (this.mainView.scrollTop > 16) {
        topBar.classList.add('opaque');
      } else {
        topBar.classList.remove('opaque');
      }
    });

    this.menuButton = topBar.querySelector('.btn-menu');
    this.menuButton.addEventListener('click', () => {
      if (this.showingMenu) this.hideMenu();
      else this.showMenu();
    });

    this.resultButton = topBar.querySelector('.btn-result');
    this.resultButton.addEventListener('click', () => {
      this.switchTab(this.resultTab);
    });

    this.backButton = topBar.querySelector('.btn-back');
    this.backButton.addEventListener('click', () => {
      if (this.currentTab == this.aboutTab && !AppConfig.instance.hasUrl) {
        this.switchTab(this.settingsTab);
      } else if (this.currentTab == this.resultTab && this.resultTab.fromGallery) {
        this.switchTab(this.galleryTab);
      } else {
        this.switchTab(this.txt2imgTab);
      }
    });

    this.pngImportButton = topBar.querySelector('.btn-png-import');
    this.pngImportButton.addEventListener('click', () => {
      this.switchTab(this.pngImportTab);
    });

    this.tabTitle = topBar.querySelector('.tab-title');
    this.tabTitle.style.display = 'none';

    this.generateButton = topBar.querySelector('.btn-generate');
    this.generateButton.addEventListener('click', () => {
      this.generate(this.generationProgress);
    });
    this.generateButtonText = this.generateButton.querySelector('span');

    this.generationProgress = new Progress(this.generateButton.querySelector('p'), true);

    const tabs = this.root.querySelector('.tabs');

    this.settingsTab = new Settings(tabs);
    this.aboutTab = new About(tabs);
    this.resultTab = new Result(tabs);
    this.pngImportTab = new PngImport(tabs);
    this.txt2imgTab = new Txt2Img(tabs, this.settingsTab);
    this.galleryTab = new Gallery(tabs);

    this.currentTab = this.txt2imgTab;

    this.settingsTab.onSave = () => {
      this.menu.refreshOptions();
      this.switchTab(this.txt2imgTab);
    };

    this.settingsTab.onRequestInstructions = () => {
      this.switchTab(this.aboutTab);
    };

    this.resultTab.onRerun = (imageInfo, progress) => {
      this.txt2imgTab.retrieveInfo(imageInfo, false);
      this.generate(progress);
    };

    this.resultTab.onRemix = (imageInfo) => {
      this.txt2imgTab.retrieveInfo(imageInfo, true);
      this.switchTab(this.txt2imgTab);
    };

    this.pngImportTab.onLoaded = (imageData, infoText) => {
      this.hasResult = true;
      this.resultTab.displayLoaded(imageData, infoText);
      this.switchTab(this.resultTab);
    };

    this.txt2imgTab.onSubmit = () => {
      this.generate(this.generationProgress);
    };

    this.galleryTab.onView = (idic) => {
      this.resultTab.displaySaved(idic);
      this.switchTab(this.resultTab);
    };

    if (this.settingsTab.url == '') {
      this.switchTab(this.settingsTab);
    }

    document.addEventListener('keydown', (event) => {
      if (this.currentTab == this.resultTab) {
        if (event.key === 'ArrowLeft' && this.resultTab.goPrev) {
          this.resultTab.goPrev();
        } else if (event.key === 'ArrowRight' && this.resultTab.goNext) {
          this.resultTab.goNext();
        }
      }
    });
  }

  generate(/** @type {Progress} */ progress) {
    const startTime = new Date();
    const sampler = AppConfig.instance.selectedSampler;
    const resolution = this.txt2imgTab.getResolution();
    const steps = this.txt2imgTab.getSteps();
    let generationSpeed = AppConfig.instance.getGenerationSpeed(sampler, resolution);

    this.txt2imgTab.generate(
      () => {
        this.setLoading(true);
        if (this.showingMenu) {
          this.hideMenu();
        }
        if (generationSpeed) {
          progress.run(steps, generationSpeed);
        }
      },
      () => {
        this.setLoading(false);
        progress.hide();
      },
      (json) => {
        this.hasResult = true;
        this.resultTab.display(json);
        this.switchTab(this.resultTab);

        const endTime = new Date();
        const milliseconds = endTime - startTime;
        AppConfig.instance.setGenerationSpeed(sampler, resolution, milliseconds / steps);
      },
      (err) => {
        console.error(err);
      }
    );
  }

  setLoading(isLoading) {
    this.menuButton.disabled = isLoading;
    this.resultButton.disabled = isLoading;
    this.pngImportButton.disabled = isLoading;
    this.backButton.disabled = isLoading;
    this.generateButton.disabled = isLoading;

    this.generateButtonText.innerText = isLoading ? 'GENERATING...' : 'GENERATE';

    this.txt2imgTab.setLoading(isLoading);
    this.resultTab.setLoading(isLoading);
  }

  switchTab(newTab) {
    this.currentTab.hide();
    this.currentTab = newTab;
    this.currentTab.show();

    this.menuButton.style.display = this.currentTab == this.txt2imgTab ? '' : 'none';
    this.resultButton.style.display =
      this.currentTab == this.txt2imgTab && this.hasResult ? '' : 'none';
    this.backButton.style.display = this.currentTab != this.txt2imgTab ? '' : 'none';
    this.pngImportButton.style.display = this.currentTab == this.txt2imgTab ? '' : 'none';
    this.generateButton.style.display = this.currentTab == this.txt2imgTab ? '' : 'none';

    if (this.currentTab == this.settingsTab && !AppConfig.instance.hasUrl) {
      this.backButton.style.display = 'none';
    }

    if (this.currentTab == this.txt2imgTab) {
      this.txt2imgTab.resizePromptBoxes();
    } else if (this.currentTab == this.resultTab) {
      this.resultTab.resizePromptBoxes();
    }

    this.tabTitle.innerText = this.currentTab.title;
    if (this.currentTab.title != '') {
      this.tabTitle.style.display = '';
    } else {
      this.tabTitle.style.display = 'none';
    }
  }

  showMenu() {
    if (this.showingMenu) return;
    this.showingMenu = true;

    this.menu.root.style.width = this.menuWidth;
    this.mainView.style.left = this.menuWidth;

    this.setLoading(true);
    this.mainCurtain.style.display = 'block';
    this.mainCurtain.style.opacity = '0.25';
  }

  hideMenu() {
    if (!this.showingMenu) return;
    this.showingMenu = false;
    this.menu.root.style.width = '0';
    this.mainView.style.left = '0';

    this.setLoading(false);
    this.mainCurtain.style.opacity = '0';
    this.mainCurtain.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.initialize();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    window.navigator.serviceWorker.register('/sw.js').then(
      function (registration) {},
      function (err) {
        console.error(err);
      }
    );
  });
}