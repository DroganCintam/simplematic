export default class CancelToken {
  _ids = new Set();
  _nextId = 0;

  register() {
    this._ids.add(++this._nextId);
    return this._nextId;
  }

  isCanceled(id) {
    return this._ids.has(id) == false;
  }

  cancel() {
    this._ids.clear();
  }
}
