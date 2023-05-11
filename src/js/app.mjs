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
import Upscale from './components/upscale.mjs';
import Progress from './components/progress.mjs';
import ImageInfo from './types/image-info.mjs';
import ConfirmDialog from './components/confirm-dialog.mjs';
import BackgroundLoader from './background-loader.mjs';
import TopBar from './components/top-bar.mjs';

class App {
  /** @type {HTMLElement} */
  root;

  /** @type {Menu} */
  menu;

  /** @type {ConfirmDialog} */
  confirmDialog;

  /** @type {TopBar} */
  topBar;
  /** @type {HTMLElement} */
  mainView;
  /** @type {HTMLElement} */
  mainCurtain;

  /** @type {HTMLElement} */
  menuWidthElement;

  /** @type {HTMLButtonElement} */
  menuButton;
  /** @type {HTMLButtonElement} */
  resultButton;
  /** @type {HTMLButtonElement} */
  backButton;
  /** @type {HTMLButtonElement} */
  pngImportButton;
  /** @type {HTMLButtonElement} */
  galleryButton;

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

  /** @type {Upscale} */
  upscaleTab;

  /** @type {Tab} */
  currentTab;

  showingMenu = false;
  menuWidth = 'min(20rem, 100vw - 4rem)';

  hasResult = false;

  isLoading = false;

  async initialize() {
    Api.instance.baseUrl = AppConfig.instance.apiUrl;

    const backgroundLoader = new BackgroundLoader();
    await backgroundLoader.initialize();

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
    this.menu.onOpenUpscaler = () => this.switchTab(this.upscaleTab);
    this.menu.onOpenGallery = () => this.switchTab(this.galleryTab);
    this.menu.onSettings = () => this.switchTab(this.settingsTab);
    this.menu.onAbout = () => this.switchTab(this.aboutTab);

    this.menuWidthElement = document.createElement('div');
    this.menuWidthElement.style.width = this.menuWidth;
    this.menuWidthElement.style.display = 'none';
    this.root.appendChild(this.menuWidthElement);

    const topBar = new TopBar(this.root.querySelector('.top-bar'));
    this.topBar = topBar;
    document.addEventListener('scroll', () => {
      if (document.documentElement.scrollTop > 16) {
        topBar.root.classList.add('opaque');
      } else {
        topBar.root.classList.remove('opaque');
      }
    });

    this.menuButton = topBar.root.querySelector('.btn-menu');
    this.menuButton.addEventListener('click', () => {
      if (this.showingMenu) this.hideMenu();
      else this.showMenu();
    });

    this.resultButton = topBar.root.querySelector('.btn-result');
    this.resultButton.addEventListener('click', () => {
      this.switchTab(this.resultTab);
    });

    this.backButton = topBar.root.querySelector('.btn-back');
    this.backButton.addEventListener('click', () => {
      if (this.currentTab == this.aboutTab && !AppConfig.instance.hasUrl) {
        this.switchTab(this.settingsTab);
      } else if (this.currentTab == this.resultTab && this.resultTab.fromGallery) {
        this.switchTab(this.galleryTab);
      } else {
        this.switchTab(this.txt2imgTab);
      }
    });

    this.pngImportButton = topBar.root.querySelector('.btn-png-import');
    this.pngImportButton.addEventListener('click', () => {
      this.switchTab(this.pngImportTab);
    });

    this.galleryButton = topBar.root.querySelector('.btn-gallery');
    this.galleryButton.addEventListener('click', () => {
      this.switchTab(this.galleryTab);
    });

    this.tabTitle = topBar.root.querySelector('.tab-title');
    this.tabTitle.style.display = 'none';

    this.generateButton = topBar.root.querySelector('.btn-generate');
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
    this.txt2imgTab = new Txt2Img(tabs);
    this.galleryTab = new Gallery(tabs);
    this.upscaleTab = new Upscale(tabs);

    this.currentTab = this.txt2imgTab;

    this.settingsTab.onSave = () => {
      this.menu.refreshOptions();
      this.switchTab(this.txt2imgTab);
    };

    this.settingsTab.onRequestInstructions = () => {
      this.switchTab(this.aboutTab);
    };

    this.resultTab.onRerun = (imageInfo, progress) => {
      const action = () => {
        this.txt2imgTab.retrieveInfo(imageInfo, false);
        this.generate(progress);
      };
      if (
        this.txt2imgTab.mayOverwritePrompts(imageInfo.info.prompt, imageInfo.info.negativePrompt)
      ) {
        ConfirmDialog.instance.show('Current prompts will be overwritten.\nAre you sure?', action);
      } else {
        action();
      }
    };

    this.resultTab.onRemix = (imageInfo) => {
      const action = () => {
        this.txt2imgTab.retrieveInfo(imageInfo, true);
        this.switchTab(this.txt2imgTab);
      };
      if (
        this.txt2imgTab.mayOverwritePrompts(imageInfo.info.prompt, imageInfo.info.negativePrompt)
      ) {
        ConfirmDialog.instance.show('Current prompts will be overwritten.\nAre you sure?', action);
      } else {
        action();
      }
    };

    this.resultTab.onUpscale = (imageInfo) => {
      this.upscaleTab.retrieveImage(imageInfo.imageData);
      this.switchTab(this.upscaleTab);
    };

    this.resultTab.onImg2Img = (imageInfo) => {
      this.txt2imgTab.retrieveImg2Img(imageInfo.imageData);
      this.switchTab(this.txt2imgTab);
    };

    this.pngImportTab.onLoaded = (imageData, infoText) => {
      this.hasResult = true;
      this.resultTab.displayLoaded(imageData, infoText);
      this.switchTab(this.resultTab);
    };

    this.pngImportTab.onParameters = (pngInfo) => {
      const imageInfo = new ImageInfo();
      imageInfo.info = pngInfo;
      this.txt2imgTab.retrieveInfo(imageInfo, true);
      this.switchTab(this.txt2imgTab);
    };

    this.txt2imgTab.onSubmit = () => {
      this.generate(this.generationProgress);
    };

    this.galleryTab.onView = (idic) => {
      this.resultTab.displaySaved(idic);
      this.switchTab(this.resultTab);
    };

    this.confirmDialog = new ConfirmDialog(this.root.querySelector('.confirm-dialog'));

    if (this.settingsTab.url == '') {
      this.switchTab(this.settingsTab);
    }

    document.addEventListener('keydown', (event) => {
      if (this.currentTab === this.resultTab && !this.isLoading) {
        if (event.key === 'ArrowLeft' && this.resultTab.goPrev) {
          this.resultTab.goPrev();
          event.stopPropagation();
          event.preventDefault();
        } else if (event.key === 'ArrowRight' && this.resultTab.goNext) {
          this.resultTab.goNext();
          event.stopPropagation();
          event.preventDefault();
        }
      } else if (this.currentTab === this.galleryTab) {
        if (event.key === 'ArrowLeft') {
          this.galleryTab.goPrev();
          event.stopPropagation();
          event.preventDefault();
        } else if (event.key === 'ArrowRight') {
          this.galleryTab.goNext();
          event.stopPropagation();
          event.preventDefault();
        }
      } else if (this.currentTab === this.txt2imgTab && !this.isLoading && !this.showingMenu) {
        if (event.key === ',' && event.ctrlKey) {
          this.switchTab(this.settingsTab);
          event.stopPropagation();
          event.preventDefault();
        } else if (event.key === 'i' && event.ctrlKey && this.hasResult) {
          this.switchTab(this.resultTab);
          event.stopPropagation();
          event.preventDefault();
        } else if (event.key === 'g' && event.ctrlKey) {
          this.switchTab(this.galleryTab);
          event.stopPropagation();
          event.preventDefault();
        } else if (event.key === 'u' && event.ctrlKey) {
          this.switchTab(this.upscaleTab);
          event.stopPropagation();
          event.preventDefault();
        }
      }

      if (event.key === 'Escape') {
        if (ConfirmDialog.instance.isShowing) {
          ConfirmDialog.instance.noButton.click();
          event.preventDefault();
        } else if (!this.backButton.disabled) {
          this.backButton.click();
        } else if (this.showingMenu && !this.menu.isLoading) {
          this.hideMenu();
        }
      }
    });

    if (window.location.hash === '#/gallery') {
      this.switchTab(this.galleryTab);
    } else if (window.location.hash === '#/upscale') {
      this.switchTab(this.upscaleTab);
    } else if (window.location.hash === '#/settings') {
      this.switchTab(this.settingsTab);
    }
  }

  generate(/** @type {Progress} */ progress) {
    this.txt2imgTab.generate(
      () => {
        this.setLoading(true);
        if (this.showingMenu) {
          this.hideMenu();
        }
        progress.runWithApi();
      },
      () => {
        this.setLoading(false);
        progress.hide();
      },
      (json) => {
        this.hasResult = true;
        this.resultTab.display(
          json,
          this.txt2imgTab.img2imgCheckbox.checked
            ? this.txt2imgTab.img2imgInputImage.imageData
            : '',
          this.txt2imgTab.resizeModeSelector.currentValue
        );
        this.switchTab(this.resultTab);
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
    this.galleryButton.disabled = isLoading;
    this.backButton.disabled = isLoading;
    this.generateButton.disabled = isLoading;

    this.generateButtonText.innerText = isLoading ? 'GENERATING...' : 'GENERATE';

    this.txt2imgTab.setLoading(isLoading);
    this.resultTab.setLoading(isLoading);

    this.isLoading = isLoading;
  }

  switchTab(newTab) {
    this.currentTab.hide();
    this.currentTab = newTab;
    this.currentTab.show();

    this.menuButton.style.display = this.currentTab == this.txt2imgTab ? '' : 'none';
    this.resultButton.style.display =
      this.currentTab != this.resultTab && this.hasResult ? '' : 'none';
    this.backButton.style.display = this.currentTab != this.txt2imgTab ? '' : 'none';
    this.pngImportButton.style.display = this.currentTab == this.txt2imgTab ? '' : 'none';
    this.generateButton.style.display = this.currentTab == this.txt2imgTab ? '' : 'none';
    this.galleryButton.style.display = this.currentTab == this.resultTab ? '' : 'none';

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
    this.topBar.root.style.left = this.menuWidth;
    this.mainView.style.marginLeft = this.menuWidth;
    const w = getComputedStyle(this.menuWidthElement).width;
    this.mainView.style.marginRight = '-' + w;

    this.setLoading(true);
    this.mainCurtain.style.display = 'block';
    this.mainCurtain.style.opacity = '0.25';
  }

  hideMenu() {
    if (!this.showingMenu) return;
    this.showingMenu = false;
    this.menu.root.style.width = '0';
    this.topBar.root.style.left = '0';
    this.mainView.style.marginLeft = '0';
    this.mainView.style.marginRight = '0';

    this.setLoading(false);
    this.mainCurtain.style.opacity = '0';
    this.mainCurtain.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  await app.initialize();
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
