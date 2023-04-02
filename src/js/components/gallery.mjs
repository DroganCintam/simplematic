import { ImageDB, ImageDataItemCursor } from '../types/image-db.mjs';
import Tab from './tab.mjs';
import waitPromise from '../utils/waitPromise.mjs';
import ImageInfo from '../types/image-info.mjs';
import CancelToken from '../types/cancel-token.mjs';

const html = /*html*/ `
<div id="gallery-tab" class="app-tab" style="display: none">
  <div>
    <div class="options">
      <div class="tags">
      </div>
    </div>
    <ul class="grid">
    </ul>
  </div>
  <style>
    #gallery-tab > div {
      width: 100%;
      max-width: 1024px;
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: flex-start;
      gap: 1rem;
    }

    #gallery-tab .options {
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: flex-start;
    }

    #gallery-tab .tags {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: 0.5rem;
    }

    #gallery-tab .tags .tag {
      padding: 0.5rem;
      border: 1px solid hsla(0, 0%, 100%, 0.5);
      border-radius: 0.25rem;
      color: hsla(0, 0%, 100%, 0.8);
      font-size: 0.8rem;
      cursor: pointer;
    }

    #gallery-tab .tags .tag:hover {
      border-color: hsl(0, 0%, 100%);
      color: hsl(0, 0%, 100%);
    }

    #gallery-tab .tags .tag.selected,
    #gallery-tab .tags .tag.selected:hover {
      border: none;
      background-color: hsl(45, 100%, 50%);
      color: hsl(0, 0%, 0%);
    }

    #gallery-tab .grid {
      list-style: none;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0 auto;
      padding: 0;
      max-width: 1024px;
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
  /** @type {HTMLElement} */
  tags;
  /** @type {HTMLUListElement} */
  grid;

  hasLoaded = false;

  itemList = [];
  itemDict = {};

  /** @type {Object<string, HTMLElement>} */
  tagElements = {};
  /** @type {string} */
  selectedTag;
  /** @type {HTMLElement} */
  selectedTagElement;

  /** @type {Array<HTMLElement>} */
  viewerPool = [];

  cancelToken = new CancelToken();

  /** @type {(cursor: ImageDataItemCursor) => void} */
  onView;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html);
    this.title = 'GALLERY';
    this.tags = this.root.querySelector('.tags');
    this.grid = this.root.querySelector('.grid');
  }

  async show() {
    super.show();
    if (!this.hasLoaded) {
      ImageDB.instance
        .getAll()
        .then(async (result) => {
          this.hasLoaded = true;

          this.populateTagList();
          this.filterByTag('<none>');
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      this.populateTagList();
      this.filterByTag(this.selectedTag ?? '<none>');
    }
  }

  populateTagList() {
    this.tags.innerHTML = '';

    ImageDB.instance.tags.forEach((tag) => {
      const el = document.createElement('span');
      el.className = 'tag';
      el.innerText = '#' + tag;
      el.addEventListener('click', () => {
        this.filterByTag(tag);
      });
      this.tags.appendChild(el);
      this.tagElements[tag] = el;

      if (this.selectedTag && tag == this.selectedTag) {
        el.classList.add('selected');
        this.selectedTagElement = el;
      }
    });

    const noneTagEl = document.createElement('span');
    noneTagEl.classList.add('tag', 'none');
    noneTagEl.innerText = '<none>';
    noneTagEl.addEventListener('click', () => {
      this.filterByTag('<none>');
    });
    this.tags.appendChild(noneTagEl);
    this.tagElements['<none>'] = noneTagEl;

    const allTagEl = document.createElement('span');
    allTagEl.classList.add('tag', 'all');
    allTagEl.innerText = '<all>';
    allTagEl.addEventListener('click', () => {
      this.filterByTag('<all>');
    });
    this.tags.appendChild(allTagEl);
    this.tagElements['<all>'] = allTagEl;
  }

  async filterByTag(tag) {
    if (this.selectedTag && this.selectedTag != tag && this.selectedTagElement) {
      this.selectedTagElement.classList.remove('selected');
    }

    this.selectedTagElement = this.tagElements[tag];
    if (this.selectedTagElement) {
      this.selectedTagElement.classList.add('selected');
    }
    this.selectedTag = tag;

    const noneTag = tag === '<none>';
    const allTag = tag === '<all>';
    const list = ImageDB.instance.imageList;

    this.itemList = [];
    this.itemDict = {};

    const existingViewers = [];
    for (let i = 0; i < this.grid.children.length; ++i) {
      existingViewers.push(this.grid.children.item(i));
    }

    let visibleViewers = 0;

    this.cancelToken.cancel();
    const jobId = this.cancelToken.register();

    for (let i = 0; i < list.length; ++i) {
      const idic = list[i];
      if (!allTag) {
        if (
          (noneTag && idic.value.tags && idic.value.tags.length > 0) ||
          (!noneTag && (!idic.value.tags || !idic.value.tags.includes(tag)))
        ) {
          continue;
        }
      }

      const row = idic.value;
      let viewer;
      if (existingViewers.length - visibleViewers <= 0) {
        viewer = this.spawnViewer(row);
        this.grid.appendChild(viewer);
      } else {
        viewer = existingViewers[visibleViewers];
        this.updateViewer(viewer, row);
      }
      ++visibleViewers;

      this.itemList.push({
        viewer,
        row,
      });
      this.itemDict[row.uuid] = viewer;

      await waitPromise(1);

      if (this.cancelToken.isCanceled(jobId)) break;
    }

    if (!this.cancelToken.isCanceled(jobId)) {
      while (this.grid.children.length > visibleViewers) {
        this.recycleViewer(this.grid.lastElementChild);
        await waitPromise(1);
        if (this.cancelToken.isCanceled(jobId)) break;
      }
    }
  }

  /**
   * @param {ImageInfo} row
   * @returns {HTMLElement}
   */
  spawnViewer(row) {
    /** @type {HTMLElement} */
    let viewer;
    /** @type {HTMLImageElement} */
    let img;
    if (this.viewerPool.length > 0) {
      viewer = this.viewerPool.pop();
      img = viewer.querySelector('img');
    } else {
      viewer = document.createElement('li');
      img = document.createElement('img');
      img.addEventListener('click', () => {
        const uuid = img.getAttribute('data-uuid');
        this.onView(ImageDB.instance.get(uuid));
      });
      viewer.appendChild(img);
    }

    if (row.width == 768) {
      viewer.className = 'landscape';
    } else if (row.height == 768) {
      viewer.className = 'portrait';
    } else {
      viewer.className = 'square';
    }
    img.src = row.data;
    img.setAttribute('data-uuid', row.uuid);
    return viewer;
  }

  /**
   * @param {ImageInfo} row
   */
  updateViewer(viewer, row) {
    const img = viewer.querySelector('img');
    if (row.width == 768) {
      viewer.className = 'landscape';
    } else if (row.height == 768) {
      viewer.className = 'portrait';
    } else {
      viewer.className = 'square';
    }
    img.src = row.data;
    img.setAttribute('data-uuid', row.uuid);
  }

  /**
   * @param {HTMLElement} viewer
   */
  recycleViewer(viewer) {
    viewer.parentElement.removeChild(viewer);
    this.viewerPool.push(viewer);
  }
}
