// some simple validation rules.
// chainable, throws an error if invalid.

import express from "express";

export default class Validator {
  constructor(obj) {
    this.obj = obj;
  }

  exists(prop) {
    if (this.obj[prop] == undefined) {
      throw new Error(`${prop} is required.`);
    }
    return new PropertyValidator(this.obj, prop);
  }
}

class PropertyValidator {
  constructor(obj, prop) {
    this.prop = prop;
    this.value = obj[prop];
  }

  isType(type) {
    if (typeof this.value !== type) {
      throw new Error(`${this.prop} must be a(n) ${type}.`);
    }
    return this;
  }

  isInt() {
    try {
      this.isType("number");
    } catch {
      throw new Error(`${this.prop} must be an integer`);
    }

    if (this.value !== Math.round(this.value)) {
      throw new Error(`${this.prop} must be an integer`);
    }
    return this;
  }

  isInRange(min, max) {
    if (this.value < min || this.value > max) {
      throw new Error(`${this.prop} must be in the range [${min}, ${max}].`);
    }
    return this;
  }

  isInLength(min, max) {
    if (this.value.length < min || this.value.length > max) {
      throw new Error(
        `${this.prop} must be between ${min} and ${max} characters long.`,
      );
    }
    return this;
  }
}

/**
 *
 * @param {(v: Validator) => *} validationFunc
 * @returns {express.RequestHandler}
 */
export function middleware(validationFunc) {
  return (req, res, next) => {
    const v = new Validator(req.body);
    try {
      validationFunc(v);
    } catch (e) {
      res.status(422).json({
        error: e.message,
      });
      return;
    }

    next();
  };
}
