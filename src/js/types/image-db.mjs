import ImageInfo from './image-info.mjs';

const dbName = 'imagedb';
const dbVersion = 1;
const imageStoreName = 'images';

export class ImageDataItem {
  /** @type {string} */
  uuid;
  /** @type {string} */
  data;
  /** @type {Date} */
  timestamp;
  /** @type {boolean} */
  imported;
  /** @type {Array<string>} */
  tags;

  prompt = '';
  negativePrompt = '';
  width = 512;
  height = 512;
  steps = 1;
  cfg = 1;
  seed = 0;
  sampler = '';
  modelHash = '';
  modelName = '';
  denoisingStrength = 0;

  inputImage = '';
  inputResizeMode = 0;
}

export class ImageDataItemCursor {
  /** @type {ImageDataItem} */
  value;

  /** @type {ImageDataItemCursor} */
  prev;
  /** @type {ImageDataItemCursor} */
  next;
}

export class ImageDB {
  static _inst;

  /** @type {ImageDB} */
  static get instance() {
    if (!ImageDB._inst) {
      ImageDB._inst = new ImageDB();
    }
    return ImageDB._inst;
  }

  /** @type {Array<ImageDataItemCursor>} */
  imageList = [];
  /** @type {Object<string, ImageDataItemCursor>} */
  imageDict = {};

  /** @type {Array<string>} */
  tags = [];
  /** @type {Object<string, number>} */
  imageCountByTag = {};

  constructor() {}

  hasTag(uuid, tag) {
    const idic = this.get(uuid);
    if (idic) {
      return idic.value.tags.includes(tag);
    }
  }

  /**
   * @returns {Promise<bool>}
   */
  addTag(uuid, tag) {
    const idic = this.get(uuid);
    if (idic) {
      if (idic.value.tags && idic.value.tags.includes(tag)) {
        return new Promise((resolve, reject) => {
          resolve(false);
        });
      }

      const newRow = Object.assign(new ImageDataItem(), idic.value);
      newRow.tags = idic.value.tags ? Array.from(idic.value.tags) : [];
      newRow.tags.push(tag);

      return new Promise(async (resolve, reject) => {
        const db = await this.openDB();
        const req = db
          .transaction([imageStoreName], 'readwrite')
          .objectStore(imageStoreName)
          .put(newRow);
        req.onerror = (event) => {
          reject(event.target.errorCode);
        };
        req.onsuccess = (event) => {
          if (!idic.value.tags) idic.value.tags = [];
          idic.value.tags.push(tag);
          if (!this.tags.includes(tag)) {
            this.tags.push(tag);
          }
          if (this.imageCountByTag[tag]) this.imageCountByTag[tag] += 1;
          else this.imageCountByTag[tag] = 1;
          resolve(true);
        };
      });
    } else {
      return new Promise((resolve, reject) => {
        resolve(false);
      });
    }
  }

  /**
   * @returns {Promise<bool>}
   */
  removeTag(uuid, tag) {
    const idic = this.get(uuid);
    if (idic) {
      if (!idic.value.tags || !idic.value.tags.includes(tag)) {
        return new Promise((resolve, reject) => {
          resolve(false);
        });
      }

      const newRow = Object.assign(new ImageDataItem(), idic.value);
      newRow.tags = idic.value.tags ? Array.from(idic.value.tags) : [];
      const idx = newRow.tags.indexOf(tag);
      newRow.tags.splice(idx, 1);

      return new Promise(async (resolve, reject) => {
        const db = await this.openDB();
        const req = db
          .transaction([imageStoreName], 'readwrite')
          .objectStore(imageStoreName)
          .put(newRow);
        req.onerror = (event) => {
          reject(event.target.errorCode);
        };
        req.onsuccess = (event) => {
          const idx = idic.value.tags.indexOf(tag);
          idic.value.tags.splice(idx, 1);
          this.imageCountByTag[tag] -= 1;
          if (this.imageCountByTag[tag] == 0) {
            delete this.imageCountByTag[tag];
            const gidx = this.tags.indexOf(tag);
            this.tags.splice(gidx, 1);
          }
          resolve(true);
        };
      });
    } else {
      return new Promise((resolve, reject) => {
        resolve(false);
      });
    }
  }

  has(uuid) {
    return uuid in this.imageDict;
  }

  get(uuid) {
    if (uuid in this.imageDict) {
      return this.imageDict[uuid];
    }
  }

  /** @returns {Promise<Array<ImageDataItemCursor>>} */
  getAll() {
    return new Promise(async (resolve, reject) => {
      const db = await this.openDB();
      const index = db
        .transaction([imageStoreName], 'readonly')
        .objectStore(imageStoreName)
        .index('timestamp');
      const cursor = index.openCursor(null, 'prev');

      /** @type {Array<ImageDataItem>} */
      const list = [];
      /** @type {Object<string, ImageDataItem>} */
      const dict = {};
      /** @type {Set<string>} */
      const tagSet = new Set();

      this.imageList = [];
      this.imageDict = {};
      this.imageCountByTag = {};

      cursor.onerror = (event) => {
        reject(event.target.errorCode);
      };
      cursor.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const row = cursor.value;
          list.push(row);
          dict[row.uuid] = row;
          cursor.continue();
        } else {
          list.forEach((row) => {
            const idic = new ImageDataItemCursor();
            idic.value = row;
            this.imageList.push(idic);
            this.imageDict[idic.value.uuid] = idic;
            if (row.tags) {
              row.tags.forEach((tag) => {
                tagSet.add(tag);
                if (this.imageCountByTag[tag]) this.imageCountByTag[tag] += 1;
                else this.imageCountByTag[tag] = 1;
              });
            }
          });
          this.imageList.forEach((idic, index) => {
            if (index > 0) {
              idic.prev = this.imageList[index - 1];
            }
            if (index + 1 < this.imageList.length) {
              idic.next = this.imageList[index + 1];
            }
          });
          this.tags = new Array(...tagSet.values());
          resolve(this.imageList);
        }
      };
    });
  }

  add(/** @type {ImageInfo} */ img) {
    return new Promise(async (resolve, reject) => {
      const row = Object.assign(new ImageDataItem(), {
        uuid: img.uuid,
        data: img.imageData,
        timestamp: img.timestamp,
        imported: img.imported,
        inputImage: img.inputImage,
        inputResizeMode: img.inputResizeMode,
        ...img.info,
      });
      const db = await this.openDB();
      const req = db
        .transaction([imageStoreName], 'readwrite')
        .objectStore(imageStoreName)
        .add(row);
      req.onerror = (event) => {
        reject(event.target.errorCode);
      };
      req.onsuccess = (event) => {
        const idic = new ImageDataItemCursor();
        idic.value = row;
        if (this.imageList.length > 0) {
          idic.next = this.imageList[0];
          this.imageList[0].prev = idic;
        }
        this.imageList.unshift(idic);
        this.imageDict[row.uuid] = idic;
        resolve(idic);
      };
    });
  }

  remove(uuid) {
    return new Promise(async (resolve, reject) => {
      const db = await this.openDB();
      const req = db
        .transaction([imageStoreName], 'readwrite')
        .objectStore(imageStoreName)
        .delete(uuid);
      req.onerror = (event) => {
        reject(event.target.errorCode);
      };
      req.onsuccess = (event) => {
        for (let i = 0; i < this.imageList.length; ++i) {
          const idic = this.imageList[i];
          if (idic.value.uuid === uuid) {
            this.imageList.splice(i, 1);
            if (idic.prev) {
              idic.prev.next = idic.next;
            }
            if (idic.next) {
              idic.next.prev = idic.prev;
            }
            break;
          }
        }
        delete this.imageDict[uuid];
        resolve(uuid);
      };
    });
  }

  /** @returns {Promise<IDBDatabase>} */
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);
      request.onerror = (event) => {
        reject(event.target.errorCode);
      };
      request.onupgradeneeded = (event) => {
        this.initDB(event.target.result);
      };
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
    });
  }

  initDB(/** @type {IDBDatabase} */ db) {
    const imageStore = db.createObjectStore(imageStoreName, { keyPath: 'uuid' });
    imageStore.createIndex('modelHash', 'modelHash', { unique: false });
    imageStore.createIndex('timestamp', 'timestamp', { unique: false });
  }
}
