import ImageInfo from './image-info.mjs';

const dbName = 'imagedb';
const dbVersion = 1;
const storeName = 'images';

export class ImageDataItem {
  /** @type {string} */
  uuid;
  /** @type {string} */
  data;
  /** @type {Date} */
  timestamp;
  /** @type {boolean} */
  imported;
  /** @type {string[]} */
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
  /** @type {Object.<string, ImageDataItemCursor>} */
  imageDict = {};

  constructor() {}

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
        .transaction([storeName], 'readonly')
        .objectStore(storeName)
        .index('timestamp');
      const cursor = index.openCursor(null, 'prev');

      const list = [];
      this.imageList = [];
      const dict = {};
      this.imageDict = {};

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
          });
          this.imageList.forEach((idic, index) => {
            if (index > 0) {
              idic.prev = this.imageList[index - 1];
            }
            if (index + 1 < this.imageList.length) {
              idic.next = this.imageList[index + 1];
            }
          });
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
        ...img.info,
      });
      const db = await this.openDB();
      const req = db.transaction([storeName], 'readwrite').objectStore(storeName).add(row);
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
      const req = db.transaction([storeName], 'readwrite').objectStore(storeName).delete(uuid);
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
    const objectStore = db.createObjectStore('images', { keyPath: 'uuid' });
    objectStore.createIndex('modelHash', 'modelHash', { unique: false });
    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
  }
}
