import { loadSVG } from "../helpers.js";
import Page from "../Page.js";
import Note from "./Note.js";

export default class NotesPage extends Page {
  constructor() {
    super("Notes");
    this.base.classList.add("notes-page");
    this.idx = 0;
    this.notes = [];
    this.maxZ = 1;

    // load all saved notes
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("note-")) {
        const nid = Number(key.split("-")[1]);
        if (nid >= this.idx) {
          this.idx = nid + 1;
        }
        const note = new Note(nid);
        this.base.appendChild(note.base);
        this.notes.push(note);
        note.bindNotesPage(this);
        if (note.z > this.maxZ) this.maxZ = note.z;
      }
    }

    // since I can't leave a memory leak I know about, clean up any deleted notes
    window.setTimeout(() => {
      for (let i = notes.length - 1; i >= 0; i--) {
        if (notes[i].deleted) {
          notes.splice(i, 1);
        }
      }
    }, 5000);

    this.loadButtons();
  }

  async loadButtons() {
    // create the + button for creating notes
    const createBtn = await loadSVG("/assets/icons/plus-square-fill.svg");
    createBtn.classList.add("notes-menu-btn", "notes-create-button");
    createBtn.title = "create new note";
    this.base.appendChild(createBtn);

    createBtn.onclick = () => {
      this.createNote();
    };

    // trash button for deleting all notes
    const trashBtn = await loadSVG("/assets/icons/trash3-fill.svg");
    trashBtn.classList.add("notes-menu-btn", "notes-trash-button");
    trashBtn.title = "delete all notes";
    this.base.appendChild(trashBtn);

    trashBtn.onclick = () => {
      this.deleteAll();
    };
  }

  createNote() {
    // create a new note
    const note = new Note(this.idx);
    note.bindNotesPage(this);
    this.maxZ++;
    note.setZIndex(this.maxZ);
    note.setPos(
      Math.random() * (window.innerWidth - 250),
      Math.random() * (window.innerHeight - 250),
    );
    this.base.appendChild(note.base);
    this.notes.push(note);
    this.idx++;
  }

  deleteAll() {
    if (!confirm("delete all notes? this cannot be undone.")) {
      return;
    }
    for (const note of this.notes) {
      note.delete();
    }
    this.notes = [];
  }

  incrementAllZ() {
    for (const note of this.notes) {
      note.setZIndex(note.z + 1, false);
    }
    this.minimizeZValues();
  }

  minimizeZValues() {
    const zList = [];
    for (const note of this.notes) {
      zList.push(note.z);
    }
    zList.sort((a, b) => a - b);
    for (const note of this.notes) {
      note.setZIndex(zList.indexOf(note.z) + 1);
    }
    this.maxZ = zList.length;
  }
}
