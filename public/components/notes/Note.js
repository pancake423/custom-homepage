import NoteColorPopup from "./NoteColorPopup.js";

export default class Note {
  #style = 1;
  constructor(id) {
    this.id = id;
    this.base = document.createElement("div");
    this.base.classList.add("note-base", "note-theme-1");

    this.header = document.createElement("div");
    this.header.classList.add("note-header");
    this.base.appendChild(this.header);

    this.bodyDisplay = document.createElement("div");
    this.bodyDisplay.classList.add("body-display");
    this.base.appendChild(this.bodyDisplay);
    this.bodyEditor = document.createElement("textarea");
    this.bodyEditor.classList.add("body-editor");
    this.base.appendChild(this.bodyEditor);

    this.icon = document.createElement("img");
    this.icon.classList.add("note-resize-icon");
    this.icon.src = "/assets/icons/arrows-angle-expand.svg";
    this.icon.title = "resize note";

    this.delBtn = document.createElement("img");
    this.delBtn.classList.add("note-icon");
    this.delBtn.src = "/assets/icons/x.svg";
    this.delBtn.title = "delete note";

    this.colorBtn = document.createElement("img");
    this.colorBtn.classList.add("note-icon");
    this.colorBtn.src = "/assets/icons/palette.svg";
    this.colorBtn.title = "change note color";

    this.header.appendChild(this.colorBtn);
    this.header.appendChild(this.delBtn);

    this.base.appendChild(this.icon);

    this.popup = new NoteColorPopup();
    this.base.appendChild(this.popup.base);

    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;

    this.drag = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.sx = 0;
    this.sy = 0;

    this.resize = false;
    this.resizeStartX = 0;
    this.resizeStartY = 0;
    this.sw = 0;
    this.sh = 0;

    this.deleted = false;

    this.header.onmousedown = (e) => this.#md(e);
    window.addEventListener("mouseup", (e) => this.#mu(e));
    window.addEventListener("mousemove", (e) => this.#mm(e));

    this.icon.onmousedown = (e) => this.#rs(e);
    window.addEventListener("mouseup", (e) => this.#re(e));
    window.addEventListener("mousemove", (e) => this.#rm(e));

    this.bodyEditor.onkeydown = (e) => {
      if (e.ctrlKey && e.key == "Enter") {
        this.bodyEditor.blur();
      }
    };

    this.bodyEditor.onblur = (e) => {
      this.bodyEditor.style.display = "none";
      this.buildContentsMd();
    };
    this.bodyDisplay.onclick = (e) => {
      this.bodyEditor.style.display = "block";
      this.bodyEditor.focus();
    };

    this.delBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (
        e.ctrlKey ||
        confirm(
          "are you sure you want to delete this note? it can't be undone.",
        )
      )
        this.delete();
    };

    this.colorBtn.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.setStyle(await this.popup.getSelection());
    };

    this.load();
  }

  #md(e) {
    if (this.drag) return;
    this.drag = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.sx = this.x;
    this.sy = this.y;
  }

  #mu(e) {
    this.drag = false;
  }

  #mm(e) {
    if (!this.drag) return;
    this.setPos(
      this.sx + e.clientX - this.dragStartX,
      this.sy + e.clientY - this.dragStartY,
    );
  }

  #rs(e) {
    e.preventDefault();
    if (this.resize) return;
    this.resize = true;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    this.sw = this.w;
    this.sh = this.h;
  }

  #rm(e) {
    e.preventDefault();
    if (!this.resize) return;
    this.setSize(
      this.sw + e.clientX - this.resizeStartX,
      this.sh + e.clientY - this.resizeStartY,
    );
  }

  #re(e) {
    this.resize = false;
  }

  buildContentsMd(save = true) {
    const contents = this.bodyEditor.value;
    const tokens = [];
    let token = "";

    let listTokenIdx = [];

    // step 0: preprocessing
    // look for - with whitespace before and characters after and insert a space.
    // makes creating lists slightly more convenient

    let preprocessed = "";
    for (let i = 0; i < contents.length; i++) {
      preprocessed += contents[i];
      if (i == contents.length - 1) continue;
      // insert space after "-" if necessary
      if (
        (contents[i] == "-" || contents[i] == "+") &&
        (i == 0 || /\s/.test(contents[i - 1])) &&
        !/\s/.test(contents[i + 1])
      ) {
        preprocessed += " ";
      }
      // insert space after "#" if necessary
      if (
        contents[i] == "#" &&
        (i == 0 || /\s/.test(contents[i - 1]) || contents[i - 1] == "#") &&
        !/\s/.test(contents[i + 1]) &&
        contents[i + 1] != "#"
      ) {
        preprocessed += " ";
      }
    }

    // step 1: tokenize
    let idx = -2;
    for (const char of preprocessed) {
      idx++;
      if (char == "\n") {
        if (token == "-" || token == "+") {
          listTokenIdx.push(idx);
        }
        tokens.push(token, "<br>");
        token = "";
        continue;
      }
      if (char == " ") {
        if (token == "-" || token == "+") {
          listTokenIdx.push(idx);
        }
        tokens.push(token);
        token = "";
        continue;
      }

      token += char;
    }
    if (token == "-" || token == "+") {
      listTokenIdx.push(idx);
    }
    tokens.push(token, "<br>");
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i] == "" || /\s/.test(tokens[i])) tokens.splice(i, 1);
    }

    // step 2. build HTML elements (headers, list items, etc)
    let htmlElements = [];
    let innerContents = [];
    let element = null;
    let params = "";
    idx = -1;
    for (const token of tokens) {
      if (token == "-" || token == "+") {
        idx++;
        if (element !== null) {
          listTokenIdx.splice(idx, 1);
          idx--;
        }
      }
      if (element !== null) {
        if (token == "<br>") {
          if (["checked", "unchecked"].includes(element)) {
            htmlElements.push(
              `<div class="notes-li-container">
                <div class="notes-li-checkbox-${element}"></div>
                <p ${element == "checked" ? 'style="text-decoration:line-through"' : ""}>${innerContents.join(" ")}</p>
              </div>`,
            );
          } else {
            htmlElements.push(
              `<${element} ${params}>${innerContents.join(" ")}</${element}>`,
            );
          }
          innerContents = [];
          params = "";
          element = null;
          continue;
        }
        innerContents.push(token);
        continue;
      }

      // determine if token is a header # .. ######
      let isHeader = token.length <= 6;
      for (const char of token) {
        if (char !== "#") isHeader = false;
      }
      if (isHeader) {
        element = `h${token.length}`;
        continue;
      }

      // list item
      if (token == "-") {
        element = "unchecked";
        continue;
      }

      if (token == "+") {
        element = "checked";
        continue;
      }

      element = "p";
      if (token == "<br>") {
        htmlElements.push(token);
        innerContents = [];
        params = "";
        element = null;
        continue;
      }

      innerContents.push(token);
    }

    let inList = false;
    for (let i = 0; i < htmlElements.length; i++) {
      if (htmlElements[i].startsWith("<li")) {
        if (inList) continue;
        inList = true;
        htmlElements[i] = "<ul>" + htmlElements[i];
        continue;
      }

      if (inList) {
        htmlElements[i] = "</ul>" + htmlElements[i];
        inList = false;
      }
    }

    const htmlOutput = htmlElements.join(" ");
    this.bodyDisplay.innerHTML = htmlOutput;

    // add event listeners to html elements
    idx = -1;
    this.bodyDisplay.querySelectorAll(".notes-li-container").forEach((el) => {
      idx++;
      const charPos = listTokenIdx[idx];
      const [btn, text] = el.children;
      btn.onclick = (e) => {
        const s = this.bodyEditor.value;
        e.stopPropagation();
        if (btn.classList.contains("notes-li-checkbox-checked")) {
          btn.classList.add("notes-li-checkbox-unchecked");
          btn.classList.remove("notes-li-checkbox-checked");
          text.style.textDecoration = "none";
          this.bodyEditor.value =
            s.substring(0, charPos) + "-" + s.substring(charPos + 1);
        } else {
          btn.classList.add("notes-li-checkbox-checked");
          btn.classList.remove("notes-li-checkbox-unchecked");
          text.style.textDecoration = "line-through";
          this.bodyEditor.value =
            s.substring(0, charPos) + "+" + s.substring(charPos + 1);
        }
        this.save();
      };
    });
    if (save) this.save();
  }

  setPos(x, y, save = true) {
    this.x = x;
    this.y = y;
    this.base.style.left = `${x}px`;
    this.base.style.top = `${y}px`;
    if (save) this.save();
  }

  setSize(w, h, save = true) {
    this.w = Math.max(w, 100);
    this.h = Math.max(h, 100);
    this.base.style.width = `${this.w}px`;
    this.base.style.height = `${this.h}px`;
    if (save) this.save();
  }

  setStyle(style, save = true) {
    this.base.classList.remove(`note-theme-${this.#style}`);
    this.#style = Math.min(Math.max(style, 1), 6);
    this.base.classList.add(`note-theme-${this.#style}`);
    if (save) this.save();
  }

  save() {
    localStorage.setItem(
      `note-${this.id}`,
      JSON.stringify({
        x: this.x,
        y: this.y,
        w: this.w,
        h: this.h,
        style: this.#style,
        contents: this.bodyEditor.value,
      }),
    );
  }

  load() {
    const dataStr = localStorage.getItem(`note-${this.id}`);
    if (dataStr == null) {
      this.setPos(0, 0, false);
      this.setSize(250, 250, false);
      this.setStyle(1, false);
      this.save();
      return;
    }

    const data = JSON.parse(dataStr);
    this.setPos(data.x, data.y, false);
    this.setSize(data.w, data.h, false);
    this.setStyle(data.style, false);

    this.bodyEditor.value = data.contents;
    this.buildContentsMd(false);
  }

  delete() {
    localStorage.removeItem(`note-${this.id}`);
    this.base.remove();
    this.deleted = true;
  }
}
