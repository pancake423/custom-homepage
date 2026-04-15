export default class SelectorRow {
  constructor(label, min, max, step = 1) {
    this.base = document.createElement("div");
    this.base.classList.add("cp-selector-base");

    this.label = document.createElement("label");
    this.label.classList.add("cp-selector-label");
    this.label.htmlFor = label;
    this.label.innerText = label;

    this.slider = document.createElement("input");
    this.slider.classList.add("cp-selector-slider");
    this.slider.type = "range";
    this.slider.min = min;
    this.slider.max = max;
    this.slider.name = label;
    this.slider.step = step;

    this.input = document.createElement("input");
    this.input.classList.add("cp-selector-input");
    this.input.type = "number";
    this.input.min = min;
    this.input.max = max;
    this.input.name = label;
    this.input.step = step;

    this.base.appendChild(this.label);
    this.base.appendChild(this.slider);
    this.base.appendChild(this.input);

    // sync the value of the input and slider
    this.input.oninput = () => {
      this.slider.value = this.input.value;
      if (this.callback) this.callback();
    };
    this.slider.oninput = (e) => {
      e.stopPropagation();
      this.input.value = this.slider.value;
      if (this.callback) this.callback();
    };

    this.slider.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
  }

  setUpdateCallback(fn) {
    this.callback = fn;
  }

  getValue() {
    return this.slider.valueAsNumber;
  }

  setValue(v) {
    this.input.value = v;
    this.slider.value = v;
  }

  setSliderColor(c) {
    this.input.style.accentColor = c;
    this.slider.style.accentColor = c;
  }
}
