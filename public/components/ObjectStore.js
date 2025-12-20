/*
simple persistent object storage.

stores an array of objects in LocalStorage
*/

export default class ObjectStore {
  #data;
  #key;
  #id_key;

  /**
   * creates a new object store or accesses an existing object store.
   *
   * @param {string} key
   */
  constructor(key) {
    this.#key = String(key);
    this.#id_key = this.#key + "-id";
    this.#setIfNull(this.#key, {});
    this.#setIfNull(this.#id_key, 0);
    this.#fetchData();
  }

  #setIfNull(key, value) {
    if (localStorage.getItem(key) == null) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  #getIdAndIncrement() {
    const id = JSON.parse(localStorage.getItem(this.#id_key));
    localStorage.setItem(this.#id_key, id + 1);
    return id;
  }

  #fetchData() {
    this.#data = JSON.parse(localStorage.getItem(this.#key));
  }

  #saveChanges() {
    localStorage.setItem(this.#key, JSON.stringify(this.#data));
  }

  /**
   * get a single object by ID.
   *
   * @param {string|number} id - the id of the object.
   * @returns {object}
   */
  get(id) {
    this.#fetchData();
    return this.#data[id];
  }

  /**
   * get an object containing all objects in the Object Store.
   *
   * @param {bool} [array] - if true, return the objects in an array rather than an object.
   *
   * @returns {array|object}
   */
  getAll(array = false) {
    this.#fetchData();
    return array ? Object.values(this.#data) : this.#data;
  }

  /**
   * set the value of object 'id' to 'value
   * @param {number|string} id - the id of the object to update or create
   * @param {*} value - the value to store
   */
  set(id, value) {
    this.#fetchData();
    this.#data[id] = value;
    this.#saveChanges();
  }

  /**
   * save an object to the object store. Automatically
   * gives it an integer key.
   *
   * @param {*} value - the object to save
   * @returns {Number} the key that the object is saved to
   */
  save(value) {
    this.#fetchData();
    const id = this.#getIdAndIncrement();
    this.#data[id] = value;
    this.#saveChanges();
    return id;
  }

  /**
   * deletes an object by id from the object store.
   *
   * @param {Number|string} id - the ID of the object to delete
   */
  delete(id) {
    this.#fetchData();
    delete this.#data[id];
    this.#saveChanges();
  }
}
