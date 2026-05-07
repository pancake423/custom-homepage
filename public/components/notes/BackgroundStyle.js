/**
 * styling configuration for the lattice background pattern.
 */

import ObjectStore from "../ObjectStore.js";

const DEFAULT_PROPS = {
  "line-width": 10,
  "spacing-vert": 300,
  "spacing-horiz": 150,
  "f1-petals": 2,
  "f2-petals": 4,
  "flower-size": 25,
  "flower-center-size": 5,
  "flower-centers": 15,
  "leaf-size": 15,
  "vine-width": 15,
  "vine-prob": 0.6,
  "vine-tightness": 6, // how tightly wound vines are around the lattice
  "flower-prob": 0.2,
  "leaf-prob": 0.75,
};

export default class BackgroundStyle extends ObjectStore {
  constructor() {
    super("notes-bg-styles");

    // make sure that the default properties are set on the object store
    const setIfUndefined = (k, v) => {
      if (this.get(k) == undefined) {
        this.set(k, v);
      }
    };
    for (const [k, v] of Object.entries(DEFAULT_PROPS)) {
      setIfUndefined(k, v);
    }
  }
}
