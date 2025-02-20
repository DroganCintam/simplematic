import { ImageDB, ImageDataItemCursor } from '../types/image-db.mjs';
import Tab from './tab.mjs';
import waitPromise from '../utils/waitPromise.mjs';
import ImageInfo from '../types/image-info.mjs';
import CancelToken from '../types/cancel-token.mjs';
import Component from './component.mjs';

const html = /*html*/ `
<div id="gallery-tab" class="app-tab" style="display: none">
  <div>
    <div data-options>
      <div data-tags></div>
    </div>
    <div data-pagination>
      <button type="button" data-btn-prev title="Previous page">
        <img src="/img/chevron-left-solid.svg"/>
      </button>
      <div data-pages>
        <span data-current-page>1</span>
        <span>/</span>
        <span data-page-count>1</span>
      </div>
      <button type="button" data-btn-next title="Next page">
        <img src="/img/chevron-right-solid.svg"/>
      </button>
    </div>
    <ul data-grid>
    </ul>
  </div>
  
</div>
`;

const css = /*css*/ `
#gallery-tab > div {
  width: 100%;
  max-width: 1024px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 1rem;
}

#gallery-tab [data-options] {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
}

#gallery-tab [data-tags] {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
}

#gallery-tab [data-tags] .tag {
  padding: 0.5rem;
  border: 1px solid hsla(0, 0%, 100%, 0.5);
  border-radius: 0.25rem;
  color: hsla(0, 0%, 100%, 0.8);
  font-size: 0.8rem;
  cursor: pointer;
}

#gallery-tab [data-tags] .tag:hover {
  border-color: hsl(0, 0%, 100%);
  color: hsl(0, 0%, 100%);
}

#gallery-tab [data-tags] .tag.selected,
#gallery-tab [data-tags] .tag.selected:hover {
  border: none;
  background-color: hsl(45, 100%, 50%);
  color: hsl(0, 0%, 0%);
}

#gallery-tab [data-pagination] {
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
}

#gallery-tab [data-pagination] button {
  background: none;
  border: 0;
  font-size: 0.75rem;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  column-gap: 0.5rem;
  color: hsla(0, 0%, 100%, 1);
  border-radius: 0.5rem;
}

@supports not (-webkit-touch-callout: none) {
  #gallery-tab [data-pagination] button:hover {
    background-color: hsla(0, 0%, 100%, 0.5);
  }
}

#gallery-tab [data-pagination] button:disabled {
  color: hsla(0, 0%, 100%, 0.5);
}

#gallery-tab [data-pagination] button:disabled:hover {
  background: none;
}

#gallery-tab [data-pagination] button img {
  width: 1rem;
  height: 1rem;
}

#gallery-tab [data-btn-prev],
#gallery-tab [data-btn-next],
#gallery-tab [data-pages] {
  flex-grow: 1;
}

#gallery-tab [data-pagination] [data-pages] {
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  background-color: hsla(0, 0%, 0%, 0.5);
  border-radius: 0.5rem;
  padding: 0.5rem;
}

#gallery-tab [data-grid] {
  list-style: none;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 auto;
  padding: 0;
  max-width: 1024px;
}

#gallery-tab [data-grid] li {
  flex: 1 1 auto;
  cursor: pointer;
  position: relative;
  height: 8rem;
}

#gallery-tab [data-grid] li > img {
  object-fit: cover;
  width: 100%;
  height: 100%;
  vertical-align: middle;
  border-radius: 0.25rem;
  border: 1px solid #ffffff;
}

#gallery-tab [data-grid] li.landscape {
  width: 12rem;
}

#gallery-tab [data-grid] li.portrait {
  width: 5rem;
}

#gallery-tab [data-grid] li.square {
  width: 8rem;
}

#gallery-tab .[data-grid]::after {
  content: '';
  flex-grow: 999;
}
`;

export const ItemPerPage = 20;

export default class Gallery extends Tab {
  /** @type {HTMLElement} */
  tags;

  /** @type {HTMLButtonElement} */
  prevPageButton;
  /** @type {HTMLButtonElement} */
  nextPageButton;
  /** @type {HTMLSpanElement} */
  currentPageSpan;
  /** @type {HTMLSpanElement} */
  pageCountSpan;

  /** @type {HTMLUListElement} */
  grid;

  hasLoaded = false;

  /** @type {Object<string, HTMLElement>} */
  tagElements = {};
  /** @type {string} */
  selectedTag;
  /** @type {HTMLElement} */
  selectedTagElement;

  /** @type {Array<HTMLElement>} */
  viewerPool = [];

  cancelToken = new CancelToken();

  /** @type {Array<ImageDataItemCursor>} */
  filteredItems = [];
  currentPage = 1;
  pageCount = 0;

  /** @type {(cursor: ImageDataItemCursor) => void} */
  onView;

  constructor(/** @type {HTMLElement} */ parent) {
    super(parent, html, css);
    this.title = 'GALLERY';
    this.tags = this.root.querySelector('[data-tags]');
    this.grid = this.root.querySelector('[data-grid]');
    this.prevPageButton = this.root.querySelector('[data-btn-prev]');
    this.nextPageButton = this.root.querySelector('[data-btn-next]');
    this.currentPageSpan = this.root.querySelector('[data-current-page]');
    this.pageCountSpan = this.root.querySelector('[data-page-count]');

    this.prevPageButton.addEventListener('click', () => {
      this.goPrev();
    });

    this.nextPageButton.addEventListener('click', () => {
      this.goNext();
    });
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
      const el = Component.fromHTML(`<span class="tag">#${tag}</span>`);
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

    const noneTagEl = Component.fromHTML(`<span class="tag none">&lt;none&gt;</span>`);
    noneTagEl.addEventListener('click', () => {
      this.filterByTag('<none>');
    });
    this.tags.appendChild(noneTagEl);
    this.tagElements['<none>'] = noneTagEl;

    const allTagEl = Component.fromHTML(`<span class="tag all">&lt;all&gt;</span>`);
    allTagEl.addEventListener('click', () => {
      this.filterByTag('<all>');
    });
    this.tags.appendChild(allTagEl);
    this.tagElements['<all>'] = allTagEl;
  }

  async filterByTag(tag) {
    if (tag && tag !== '<all>' && !ImageDB.instance.imageCountByTag[tag]) {
      tag = '<none>';
    }

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

    /** @type {ImageDataItemCursor | null} */
    let prev = null;

    const filteredItems = (this.filteredItems = []);
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

      filteredItems.push(idic);
      if (prev != null) {
        idic.prev = prev;
        prev.next = idic;
      } else {
        idic.prev = null;
      }
      prev = idic;
    }

    if (prev != null) {
      prev.next = null;
    }

    this.pageCount = Math.ceil(filteredItems.length / ItemPerPage);
    if (this.pageCount == 0) {
      this.pageCount = 1;
    }
    this.pageCountSpan.innerText = this.pageCount.toString();

    this.showImages();
  }

  async goPrev() {
    if (this.currentPage > 1) {
      --this.currentPage;
      this.currentPageSpan.innerText = this.currentPage.toString();
      await this.showImages();
    }
  }

  async goNext() {
    if (this.currentPage < this.pageCount) {
      ++this.currentPage;
      this.currentPageSpan.innerText = this.currentPage.toString();
      await this.showImages();
    }
  }

  async showImages() {
    const existingViewers = [];
    for (let i = 0; i < this.grid.children.length; ++i) {
      existingViewers.push(this.grid.children.item(i));
    }

    let visibleViewers = 0;

    this.cancelToken.cancel();
    const jobId = this.cancelToken.register();

    const filteredItems = this.filteredItems;

    if (this.currentPage > this.pageCount) {
      this.currentPage = this.pageCount;
      this.currentPageSpan.innerText = this.currentPage.toString();
    }
    this.prevPageButton.disabled = this.currentPage == 1;
    this.nextPageButton.disabled = this.currentPage == this.pageCount;

    for (
      let i = ItemPerPage * (this.currentPage - 1),
        c = Math.min(filteredItems.length, ItemPerPage * this.currentPage);
      i < c;
      ++i
    ) {
      const idic = filteredItems[i];

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
      viewer = Component.fromHTML(`<li><img></li>`);
      img = viewer.querySelector('img');
      img.addEventListener('click', () => {
        const uuid = img.getAttribute('data-uuid');
        this.onView(ImageDB.instance.get(uuid));
      });
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
