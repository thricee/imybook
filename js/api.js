// ==========================================================
// api.js - talks to the Open Library API and turns the JSON
// into Book objects (Object-Oriented Programming).
// API documentation: https://openlibrary.org/developers/api
// ==========================================================

// ---------- CLASS: Book ----------
// One Book object = one book returned by the API.
class Book {
  constructor(doc) {
    // Read each value from the JSON. If the API does not send a value,
    // use a safe default so the page never shows "undefined".
    this.workKey      = doc.key || '';                                  // e.g. "/works/OL82563W"
    this.title        = doc.title || 'Untitled';
    this.authors      = Array.isArray(doc.author_name) ? doc.author_name : [];
    this.year         = doc.first_publish_year || null;
    this.pages        = doc.number_of_pages_median || null;
    this.coverId      = doc.cover_i || null;
    this.rating       = typeof doc.ratings_average === 'number' ? doc.ratings_average : null;
    this.ratingCount  = doc.ratings_count || 0;
    this.editionCount = doc.edition_count || 0;
    // Keep only the first 8 subjects so the screen is not too crowded
    this.subjects     = Array.isArray(doc.subject) ? doc.subject.slice(0, 8) : [];
  }

  // Returns the cover picture link from the Open Library Covers API
  getCoverUrl(size = 'M') {
    if (!this.coverId) return null;
    return `https://covers.openlibrary.org/b/id/${this.coverId}-${size}.jpg`;
  }

  getAuthorText() {
    return this.authors.length > 0 ? this.authors.slice(0, 2).join(', ') : 'Unknown author';
  }

  getPagesText() {
    return this.pages ? `${this.pages} pages` : 'Pages not available';
  }

  getRatingText() {
    return this.rating !== null ? `${this.rating.toFixed(1)} / 5 (${this.ratingCount} ratings)` : 'No rating yet';
  }

  // Classifies the book by its number of pages
  getLengthCategory() {
    if (this.pages === null) return 'unknown';
    if (this.pages < 200) return 'short';
    else if (this.pages <= 400) return 'medium';
    else return 'long';
  }
}

// ---------- CLASS: BookAPI ----------
// All API requests are inside this class.
class BookAPI {
  static BASE_URL = 'https://openlibrary.org';
  static FIELDS = 'key,title,author_name,first_publish_year,number_of_pages_median,' +
                  'cover_i,ratings_average,ratings_count,edition_count,subject';

  // Fetches a URL and returns the JSON. If the first try fails because
  // the server is slow or busy, it automatically tries ONE more time.
  static async fetchJSON(url) {
    try {
      return await this.fetchOnce(url);
    } catch (err) {
      if (err.retry) return await this.fetchOnce(url);   // second (last) try
      throw err;
    }
  }

  // One request. Throws an Error with a clear message when something goes wrong.
  static async fetchOnce(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000); // 20 second time limit

    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err) {
      // fetch() itself fails when there is no internet or the request timed out
      if (err.name === 'AbortError') {
        const timeout = new Error('The book server took too long to reply. Please try again.');
        timeout.retry = true;
        throw timeout;
      }
      throw new Error('Cannot connect to the book server. Please check your internet connection.');
    } finally {
      clearTimeout(timer);
    }

    // The server answered but with an error code (404, 500, 503 ...)
    if (!response.ok) {
      const httpError = new Error(`The book server returned an error (HTTP ${response.status}). Please try again later.`);
      httpError.retry = response.status >= 500;     // only retry server-side errors
      throw httpError;
    }

    try {
      return await response.json();          // convert the text reply into a JS object
    } catch (err) {
      throw new Error('The book server sent data that could not be read.');
    }
  }

  // Search by title, author or any keyword. Returns an array of Book objects.
  static async searchBooks(text, type) {
    const query = encodeURIComponent(text.trim());
    let param;
    switch (type) {
      case 'title':  param = `title=${query}`;  break;
      case 'author': param = `author=${query}`; break;
      default:       param = `q=${query}`;
    }
    const url = `${this.BASE_URL}/search.json?${param}&limit=24&fields=${this.FIELDS}`;
    const data = await this.fetchJSON(url);

    // Check the JSON has the structure we expect
    if (!data || !Array.isArray(data.docs)) {
      throw new Error('Unexpected reply from the book server.');
    }
    return { total: data.numFound || 0, books: data.docs.map(doc => new Book(doc)) };
  }

  // Get books for one subject/genre (used by the Suggestion page)
  static async searchBySubject(subject, author) {
    let url = `${this.BASE_URL}/search.json?subject=${encodeURIComponent(subject)}` +
              `&sort=rating&limit=60&fields=${this.FIELDS}`;
    if (author) url += `&author=${encodeURIComponent(author)}`;
    const data = await this.fetchJSON(url);
    if (!data || !Array.isArray(data.docs)) {
      throw new Error('Unexpected reply from the book server.');
    }
    return data.docs.map(doc => new Book(doc));
  }

  // Get the description (summary) of one book from the Works API
  static async getDescription(workKey) {
    const data = await this.fetchJSON(`${this.BASE_URL}${workKey}.json`);
    // description can be a plain string OR an object { type, value }
    if (typeof data.description === 'string') return data.description;
    if (data.description && data.description.value) return data.description.value;
    return null;
  }
}
