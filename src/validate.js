// some simple validation rules.
// chainable, throws an error if invalid.

export default class Validator {
  constructor(obj) {
    this.obj = obj;
  }

  exists(prop) {
    if (this.obj[prop] == undefined) {
      throw new Error(`${prop} is a required field.`);
    }
    return new PropertyValidator(this.obj, this.prop);
  }
}

class PropertyValidator {
  constructor(obj, prop) {
    this.value = obj[prop];
  }

  isType(type) {
    if (typeof this.value !== type) {
      throw new Error(`${prop} must be a(n) ${type}.`);
    }
    return this;
  }

  isInt() {
    try {
      this.isType("number");
    } catch {
      throw new Error(`${prop} must be an integer`);
    }

    if (this.value !== Math.round(this.value)) {
      throw new Error(`${prop} must be an integer`);
    }
    return this;
  }
}
