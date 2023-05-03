const defaultBackgoundImage = '/img/bg.png';
const dimmingLinear = 'linear-gradient(to bottom, #00000070, #00000070)';

const KEY_USING_CUSTOM = 'usingCustomBackground';
const KEY_DIMMED_BACKGROUND = 'dimmedBackground';

export default class BackgroundLoader {
  /** @type {BackgroundLoader} */
  static _instance;

  /** @type {BackgroundLoader} */
  static get instance() {
    return BackgroundLoader._instance;
  }

  /** @type {HTMLStyleElement} */
  styleTag;

  _cachedCustomBackground = '';

  constructor() {
    BackgroundLoader._instance = this;

    this.styleTag = document.createElement('style');
    document.head.appendChild(this.styleTag);

    this._updateBackgroundStyles(defaultBackgoundImage, this.isDimmedBackground);
  }

  initialize() {
    const usingCustom = localStorage.getItem(KEY_USING_CUSTOM);
    return new Promise((resolve, reject) => {
      this._openDB()
        .then((db) => {
          const objectStore = db.transaction(['images'], 'readonly').objectStore('images');
          const imgRequest = objectStore.get('custom_bg');
          imgRequest.onerror = (event) => {
            reject(event.target.error);
          };
          imgRequest.onsuccess = (event) => {
            const imageData = event.target.result;
            this._cachedCustomBackground = imageData;

            if (usingCustom === 'true' && imageData) {
              this._updateBackgroundStyles(imageData, this.isDimmedBackground);
            }

            resolve();
          };
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  _updateBackgroundStyles(background, dimmed) {
    this.styleTag.textContent = /*css*/ `
    body {
      background: ${dimmed ? dimmingLinear + ', ' : ''} url(${background});
      background-position: center top;
      background-size: cover;
      background-repeat: no-repeat;
      background-attachment: fixed;
      background-color: #303030;
    }
    `;
  }

  get currentBackground() {
    if (this.isUsingCustomBackground && this.hasCustomBackground) {
      return this.customBackgroundImage;
    } else {
      return defaultBackgoundImage;
    }
  }

  get isUsingCustomBackground() {
    const usingCustom = localStorage.getItem(KEY_USING_CUSTOM);
    return usingCustom === 'true';
  }

  get hasCustomBackground() {
    const customBackground = this.customBackgroundImage;
    return typeof customBackground === 'string' && customBackground !== '';
  }

  get customBackgroundImage() {
    return this._cachedCustomBackground;
  }

  get isDimmedBackground() {
    return localStorage.getItem(KEY_DIMMED_BACKGROUND) === 'true';
  }

  setUsingCustomBackground(/** @type {Boolean} */ enabled) {
    let background = '';
    if (enabled) {
      localStorage.setItem(KEY_USING_CUSTOM, 'true');
      background = this.currentBackground;
    } else {
      localStorage.setItem(KEY_USING_CUSTOM, 'false');
      background = defaultBackgoundImage;
    }
    this._updateBackgroundStyles(background, this.isDimmedBackground);
  }

  setCustomBackgroundImage(imageData) {
    return new Promise((resolve, reject) => {
      this._openDB()
        .then((db) => {
          const objectStore = db.transaction(['images'], 'readwrite').objectStore('images');
          const imgRequest = objectStore.put(imageData, 'custom_bg');
          imgRequest.onerror = (event) => {
            reject(event.target.error);
          };
          imgRequest.onsuccess = (event) => {
            this._cachedCustomBackground = imageData;
            resolve();
          };
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  setDimmedBackground(dimmed) {
    localStorage.setItem(KEY_DIMMED_BACKGROUND, dimmed ? 'true' : 'false');
    this._updateBackgroundStyles(this.currentBackground, dimmed);
  }

  /** @returns {Promise<IDBDatabase>} */
  _openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('bg', 1);
      request.onerror = (event) => {
        reject(event.target.errorCode);
      };
      request.onupgradeneeded = (event) => {
        this._initDB(event.target.result);
      };
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
    });
  }

  _initDB(/** @type {IDBDatabase} */ db) {
    db.createObjectStore('images');
  }
}
