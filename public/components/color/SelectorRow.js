export default class SelectorRow {
  constructor(label, min, max, step = 1) {
    this.base = document.createElement("div");
    this.base.classList.add("cp-selector-base");

    this.label = document.createElement("label");
    this.label.classList.add("cp-selector-label");
    this.label.htmlFor = "";
    this.label.innerText = label;

    this.slider = document.createElement("input");
    this.slider.classList.add("cp-selector-slider");
    this.slider.type = "range";
    this.slider.min = min;
    this.slider.max = max;
    this.slider.step = step;

    this.input = document.createElement("input");
    this.input.classList.add("cp-selector-input");
    this.input.type = "number";
    this.input.min = min;
    this.input.max = max;
    this.slider.step = step;

    this.base.appendChild(this.label);
    this.base.appendChild(this.slider);
    this.base.appendChild(this.input);

    // sync the value of the input and slider
    this.input.onchange = () => {
      this.setValue(this.input.value);
    };
    this.slider.onchange = () => {
      this.setValue(this.slider.value);
    };
  }

  setValue(v) {
    this.input.value = v;
    this.slider.value = v;
  }
}
