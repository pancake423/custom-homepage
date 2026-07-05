import { create } from "../helpers.js";

export default class ErrorToast {
  constructor() {
    this.toast = create(
      "div",
      ["error-toast", "error-toast-hidden"],
      document.body,
    );
  }

  /**
   * displays a new notification for the specified duration.
   * @param {*} message
   * @param {*} time
   */
  static notify(message, time) {
    const toast = new ErrorToast();
    toast.setMessage(message);
    window.setTimeout(() => toast.show(), 50);
    window.setTimeout(() => toast.hide(), time * 1000);
    window.setTimeout(() => toast.delete(), time * 1000 + 1000);
  }

  /**
   * sets the toast message.
   *
   * @param {string} msg
   */
  setMessage(msg) {
    this.toast.innerText = msg;
  }

  /**
   * shows the toast notification.
   */
  show() {
    this.toast.classList.remove("error-toast-hidden");
  }

  /**
   * hides the toast notification.
   */
  hide() {
    this.toast.classList.add("error-toast-hidden");
  }

  /**
   * remove this toast from the DOM.
   */
  delete() {
    this.toast.remove();
  }
}
