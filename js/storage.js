// ==========================================================
// storage.js - CRUD (Create, Read, Update, Delete) for the
// reading list, saved in the browser's Local Storage as JSON.
// ==========================================================

const STATUS_LABELS = {
  plan: 'Plan to Read',
  reading: 'Reading',
  finished: 'Finished'
};

// ---------- CLASS: ReadingRecord ----------
// One saved book in "My Reading List".
class ReadingRecord {
  constructor(data) {
    this.id          = data.id || ReadingRecord.makeId();
    this.workKey     = data.workKey || '';
    this.title       = (data.title || '').trim();
    this.author      = (data.author || '').trim() || 'Unknown author';
    this.pages       = Number(data.pages);
    this.currentPage = Number(data.currentPage) || 0;
    this.status      = data.status || 'plan';
    this.myRating    = data.myRating ? Number(data.myRating) : null;
    this.notes       = (data.notes || '').trim();
    this.reason      = data.reason || '';          // suggestion reason (from Suggest page)
    this.source      = data.source || 'manual';    // search / suggestion / manual
    this.coverUrl    = data.coverUrl || null;
    this.dateAdded   = data.dateAdded || new Date().toISOString();
  }

  static makeId() {
    return 'bk-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  // Checks every field. Returns a list of error messages (empty list = valid).
  validate() {
    const errors = [];
    if (this.title.length === 0) errors.push('Book title is required.');
    if (this.title.length > 150) errors.push('Book title must be 150 characters or less.');
    if (!Number.isInteger(this.pages) || this.pages < 1 || this.pages > 10000) {
      errors.push('Total pages must be a whole number from 1 to 10000.');
    }
    if (!Number.isInteger(this.currentPage) || this.currentPage < 0) {
      errors.push('Current page must be a whole number of 0 or more.');
    } else if (this.currentPage > this.pages) {
      errors.push('Current page cannot be more than the total pages.');
    }
    if (!STATUS_LABELS[this.status]) errors.push('Please choose a valid reading status.');
    if (this.myRating !== null && (this.myRating < 1 || this.myRating > 5)) {
      errors.push('Rating must be between 1 and 5.');
    }
    if (this.notes.length > 300) errors.push('Notes must be 300 characters or less.');
    return errors;
  }

  // ---- Calculations for this record ----
  getProgressPercent() {
    return Math.min(100, Math.round((this.currentPage / this.pages) * 100));
  }

  getPagesLeft() {
    return this.pages - this.currentPage;
  }
}

// ---------- CLASS: ReadingList ----------
// Handles all CRUD operations with Local Storage.
class ReadingList {
  static KEY = 'imybook.readingList';

  // READ - get all records from Local Storage
  static getAll() {
    const text = localStorage.getItem(this.KEY);
    if (!text) return [];
    try {
      const array = JSON.parse(text);
      return Array.isArray(array) ? array.map(item => new ReadingRecord(item)) : [];
    } catch (err) {
      console.error('Saved reading list is damaged:', err);
      return [];
    }
  }

  static findById(id) {
    return this.getAll().find(record => record.id === id) || null;
  }

  static existsByWorkKey(workKey) {
    if (!workKey) return false;
    return this.getAll().some(record => record.workKey === workKey);
  }

  // Writes the whole array back to Local Storage as JSON text
  static saveAll(records) {
    localStorage.setItem(this.KEY, JSON.stringify(records));
  }

  // CREATE - add a new record. Returns { ok, errors, record }
  static add(data) {
    const record = new ReadingRecord(data);
    const errors = record.validate();
    if (record.workKey && this.existsByWorkKey(record.workKey)) {
      errors.push(`"${record.title}" is already in your reading list.`);
    }
    if (errors.length > 0) return { ok: false, errors };

    const records = this.getAll();
    records.push(record);
    this.saveAll(records);
    return { ok: true, errors: [], record };
  }

  // UPDATE - replace the record that has the same id
  static update(id, data) {
    const records = this.getAll();
    const index = records.findIndex(record => record.id === id);
    if (index === -1) return { ok: false, errors: ['This book no longer exists in your list.'] };

    // keep the original id, date, cover, workKey, reason and source
    const old = records[index];
    const updated = new ReadingRecord({ ...old, ...data, id: old.id, dateAdded: old.dateAdded });
    const errors = updated.validate();
    if (errors.length > 0) return { ok: false, errors };

    records[index] = updated;
    this.saveAll(records);
    return { ok: true, errors: [], record: updated };
  }

  // DELETE - remove the record with this id
  static remove(id) {
    const records = this.getAll();
    const remaining = records.filter(record => record.id !== id);
    if (remaining.length === records.length) return false;
    this.saveAll(remaining);
    return true;
  }
}

// ---------- CLASS: SuggestionHistory ----------
// Saves every suggestion result in Local Storage (last 5 searches).
class SuggestionHistory {
  static KEY = 'imybook.suggestions';
  static MAX = 5;

  static getAll() {
    try {
      const array = JSON.parse(localStorage.getItem(this.KEY) || '[]');
      return Array.isArray(array) ? array : [];
    } catch (err) {
      return [];
    }
  }

  static add(entry) {
    const list = this.getAll();
    list.unshift(entry);                             // newest first
    localStorage.setItem(this.KEY, JSON.stringify(list.slice(0, this.MAX)));
  }

  static remove(index) {
    const list = this.getAll();
    list.splice(index, 1);
    localStorage.setItem(this.KEY, JSON.stringify(list));
  }

  static clear() {
    localStorage.removeItem(this.KEY);
  }
}
