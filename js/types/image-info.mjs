import readPngText from '../utils/readPngText.mjs';
import PngInfo from './png-info.mjs';

export default class ImageInfo {
  uuid = '';
  /** @type {String} */
  imageData;
  /** @type {PngInfo} */
  info;
  timestamp = 0;
  imported = false;
  saved = false;

  /**
   * @param {string} imageData
   * @param {string} infoText
   */
  constructor(imageData, infoText) {
    if (imageData && infoText) {
      this.uuid = crypto.randomUUID();
      this.imageData = 'data:image/png;base64,' + imageData;
      this.info = readPngText(infoText);
      this.timestamp = new Date();
    }
  }
}
