import { ImageDB, ImageDataItemCursor } from '../types/image-db.mjs';
import Tab from './tab.mjs';
import waitPromise from '../utils/waitPromise.mjs';

const html = /*html*/ `
<div id="gallery-tab" class="app-tab" style="display: none">
  <div class="w100p">
    <ul class="grid">
    </ul>
  </div>
  <style>
    #gallery-tab .grid {
      list-style: none;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
    }

    #gallery-tab .grid li {
      flex: 1 1 auto;
      cursor: pointer;
      position: relative;
      height: 8rem;
    }

    #gallery-tab .grid li > img {
      object-fit: cover;
      width: 100%;
      height: 100%;
      vertical-align: middle;
      border-radius: 0.25rem;
      border: 1px solid #ffffff;
    }

    #gallery-tab .grid li.landscape {
      width: 12rem;
    }

    #gallery-tab .grid li.portrait {
      width: 5rem;
    }

    #gallery-tab .grid li.square {
      width: 8rem;
    }

    #gallery-tab .grid::after {
      content: '';
      flex-grow: 999;
    }
  </style>
</div>
`;

export default class Gallery extends Tab {
  /** @type {HTMLUListElement} */
  grid;

  hasLoaded = false;

  itemList = [];
  itemDict = {};

  /** @type {(cursor: ImageDataItemCursor) => void} */
  onView;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html);
    this.title = 'GALLERY';
    this.grid = this.root.querySelector('.grid');
  }

  async show() {
    super.show();
    if (!this.hasLoaded) {
      ImageDB.instance
        .getAll()
        .then(async (result) => {
          this.hasLoaded = true;
          this.grid.innerHTML = '';
          for (let i = 0; i < result.length; ++i) {
            const idic = result[i];
            const row = idic.value;
            const item = document.createElement('li');
            if (row.width == 768) {
              item.className = 'landscape';
            } else if (row.height == 768) {
              item.className = 'portrait';
            } else {
              item.className = 'square';
            }
            const img = document.createElement('img');
            img.src = row.data;
            item.appendChild(img);
            this.grid.appendChild(item);

            this.itemList.push({
              item,
              row,
            });
            this.itemDict[row.uuid] = item;

            img.addEventListener('click', () => {
              this.onView(idic);
            });

            await waitPromise(1);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      const list = ImageDB.instance.imageList;
      const dict = ImageDB.instance.imageDict;
      for (let i = 0; i < this.itemList.length; ++i) {
        const image = this.itemList[i];
        if (!(image.row.uuid in dict)) {
          this.grid.removeChild(image.item);
          this.itemList.splice(i, 1);
          delete this.itemDict[image.row.uuid];
          await waitPromise(1);
        }
      }
      for (let i = list.length - 1; i >= 0; --i) {
        const idic = list[i];
        const row = idic.value;
        if (row.uuid in this.itemDict) continue;
        const item = document.createElement('li');
        if (row.width == 768) {
          item.className = 'landscape';
        } else if (row.height == 768) {
          item.className = 'portrait';
        } else {
          item.className = 'square';
        }
        const img = document.createElement('img');
        img.src = row.data;
        item.appendChild(img);
        this.grid.insertBefore(item, this.grid.firstChild);

        this.itemList.unshift({
          item,
          row,
        });
        this.itemDict[row.uuid] = item;

        img.addEventListener('click', () => {
          this.onView(idic);
        });

        await waitPromise(1);
      }
    }
  }
}
