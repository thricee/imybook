// ==========================================================
// search.js - PAGE 1: Book Search + Reading Time Calculator
// ==========================================================

// ---- Get the HTML elements we need (DOM) ----
const searchForm    = document.getElementById('searchForm');
const searchType    = document.getElementById('searchType');
const searchText    = document.getElementById('searchText');
const searchBtn     = document.getElementById('searchBtn');
const clearBtn      = document.getElementById('clearBtn');
const searchMessage = document.getElementById('searchMessage');
const loading       = document.getElementById('loading');
const resultsBox    = document.getElementById('resultsBox');
const resultsTitle  = document.getElementById('resultsTitle');
const resultsDiv    = document.getElementById('results');
const detailsBox    = document.getElementById('detailsBox');
const detailsDiv    = document.getElementById('details');
const addMessage    = document.getElementById('addMessage');
const calcBox       = document.getElementById('calcBox');
const calcForm      = document.getElementById('calcForm');
const calcMessage   = document.getElementById('calcMessage');
const calcResult    = document.getElementById('calcResult');

let currentBooks = [];      // books from the last search
let selectedBook = null;    // the book the user clicked

// Change the placeholder when the "Search by" dropdown changes
searchType.addEventListener('change', () => {
  const examples = { title: 'e.g. Harry Potter', author: 'e.g. Roald Dahl', any: 'e.g. space adventure' };
  searchText.placeholder = examples[searchType.value];
  searchText.focus();
});

// ---------- EVENT 1: Search form submitted ----------
searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();               // stop the page from reloading
  const text = searchText.value.trim();

  // Input validation
  if (text.length < 2) {
    searchText.classList.add('invalid');
    showMessage(searchMessage, 'Please type at least 2 characters to search.', 'error');
    return;
  }
  searchText.classList.remove('invalid');
  hideMessage(searchMessage);

  // Reset the old results before the new search
  resultsBox.classList.add('hidden');
  detailsBox.classList.add('hidden');
  calcBox.classList.add('hidden');
  loading.classList.add('show');
  searchBtn.disabled = true;

  try {
    const result = await BookAPI.searchBooks(text, searchType.value);
    currentBooks = result.books;

    // Empty result
    if (currentBooks.length === 0) {
      showMessage(searchMessage, `No books found for "<strong>${escapeHTML(text)}</strong>". Check the spelling or try another word.`, 'warning');
      return;
    }
    showMessage(searchMessage, `Found ${result.total.toLocaleString()} books. Showing the first ${currentBooks.length}. Click "View Details" to see more.`, 'success');
    renderResults(currentBooks);
  } catch (err) {
    // API failed (no internet, timeout, server error)
    showMessage(searchMessage, `<strong>Search failed:</strong> ${escapeHTML(err.message)}`, 'error');
  } finally {
    loading.classList.remove('show');
    searchBtn.disabled = false;
  }
});

// ---------- EVENT 2: Clear button ----------
clearBtn.addEventListener('click', () => {
  searchForm.reset();
  searchText.classList.remove('invalid');
  hideMessage(searchMessage);
  resultsBox.classList.add('hidden');
  detailsBox.classList.add('hidden');
  calcBox.classList.add('hidden');
  currentBooks = [];
  selectedBook = null;
  searchText.focus();
});

// ---------- DOM: draw the result cards ----------
function renderResults(books) {
  resultsDiv.innerHTML = '';                  // remove old cards
  books.forEach((book, index) => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      ${coverHTML(book.getCoverUrl('M'), book.title)}
      <h4>${escapeHTML(book.title)}</h4>
      <p>${escapeHTML(book.getAuthorText())}</p>
      <p>${book.year ? 'First published ' + book.year : 'Year unknown'}</p>
      <p>${book.getPagesText()}</p>
      <div class="actions">
        <button type="button" class="small primary" data-index="${index}">View Details</button>
      </div>`;
    resultsDiv.appendChild(card);
  });
  attachCoverFallback(resultsDiv);
  resultsTitle.textContent = `Results (${books.length} books)`;
  resultsBox.classList.remove('hidden');
}

// ---------- EVENT 3: "View Details" clicked (event delegation) ----------
resultsDiv.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-index]');
  if (!button) return;
  selectedBook = currentBooks[Number(button.dataset.index)];
  showDetails(selectedBook);
});

// ---------- DOM: show the selected book's details ----------
function showDetails(book) {
  hideMessage(addMessage);
  const subjects = book.subjects.length > 0
    ? book.subjects.map(s => `<span class="tag">${escapeHTML(s)}</span>`).join('')
    : 'No subjects listed';

  detailsDiv.innerHTML = `
    <div>${coverHTML(book.getCoverUrl('L'), book.title)}</div>
    <div class="details-info">
      <table>
        <tr><td>Title</td><td>${escapeHTML(book.title)}</td></tr>
        <tr><td>Author(s)</td><td>${escapeHTML(book.authors.join(', ') || 'Unknown author')}</td></tr>
        <tr><td>First published</td><td>${book.year || 'Unknown'}</td></tr>
        <tr><td>Number of pages</td><td>${book.getPagesText()}</td></tr>
        <tr><td>Reader rating</td><td>${book.getRatingText()}</td></tr>
        <tr><td>Editions</td><td>${book.editionCount} edition(s)</td></tr>
        <tr><td>Subjects / Genre</td><td>${subjects}</td></tr>
        <tr><td>Description</td><td id="description"><em>Loading description...</em></td></tr>
      </table>
      <p>
        <label for="addStatus"><strong>Add as:</strong></label>
        <select id="addStatus">
          <option value="plan">Plan to Read</option>
          <option value="reading">Reading</option>
          <option value="finished">Finished</option>
        </select>
        <button type="button" class="primary" id="addBtn">+ Add to My Reading List</button>
      </p>
    </div>`;
  attachCoverFallback(detailsDiv);
  detailsBox.classList.remove('hidden');

  // EVENT 4: Add to reading list
  document.getElementById('addBtn').addEventListener('click', addSelectedBook);

  // Prepare the calculator with the page count from the API
  document.getElementById('calcPages').value = book.pages || '';
  calcResult.innerHTML = '';
  if (book.pages) {
    hideMessage(calcMessage);
  } else {
    showMessage(calcMessage, 'The API does not have a page count for this book. Please type the total pages yourself.', 'info');
  }
  calcBox.classList.remove('hidden');
  detailsBox.scrollIntoView({ behavior: 'smooth' });

  loadDescription(book);
}

// Second API call: get the description from the Works API
async function loadDescription(book) {
  const cell = document.getElementById('description');
  try {
    const text = await BookAPI.getDescription(book.workKey);
    if (selectedBook !== book) return;          // user already clicked another book
    if (text) {
      const short = text.length > 600 ? text.slice(0, 600) + '...' : text;
      cell.textContent = short;
    } else {
      cell.innerHTML = '<em>No description available for this book.</em>';
    }
  } catch (err) {
    cell.innerHTML = `<em>Description could not be loaded: ${escapeHTML(err.message)}</em>`;
  }
}

// CREATE: save the selected book into Local Storage
function addSelectedBook() {
  const book = selectedBook;
  if (!book) return;
  const status = document.getElementById('addStatus').value;

  if (!book.pages) {
    showMessage(addMessage, 'This book has no page count from the API. Please add it from the <a href="reading-list.html">My Reading List</a> page and type the pages yourself.', 'warning');
    return;
  }

  const result = ReadingList.add({
    workKey: book.workKey,
    title: book.title,
    author: book.getAuthorText(),
    pages: book.pages,
    currentPage: status === 'finished' ? book.pages : 0,
    status: status,
    coverUrl: book.getCoverUrl('S'),
    source: 'search'
  });

  if (result.ok) {
    showMessage(addMessage, `"<strong>${escapeHTML(book.title)}</strong>" was added to your reading list as <strong>${STATUS_LABELS[status]}</strong>. <a href="reading-list.html">Open My Reading List</a>`, 'success');
  } else {
    showErrors(addMessage, result.errors);
  }
}

// ---------- EVENT 5: Reading time calculator ----------
calcForm.addEventListener('submit', (event) => {
  event.preventDefault();
  calcResult.innerHTML = '';

  const pagesInput   = document.getElementById('calcPages');
  const wordsInput   = document.getElementById('calcWordsPerPage');
  const minutesInput = document.getElementById('calcMinutes');
  const pages   = Number(pagesInput.value);
  const words   = Number(wordsInput.value);
  const speed   = Number(document.getElementById('calcSpeed').value);
  const minutes = Number(minutesInput.value);

  // Validate every input, including the boundary values
  const errors = [];
  [pagesInput, wordsInput, minutesInput].forEach(i => i.classList.remove('invalid'));

  if (pagesInput.value === '' || !Number.isInteger(pages) || pages < 1 || pages > 10000) {
    errors.push('Total pages must be a whole number from 1 to 10000.');
    pagesInput.classList.add('invalid');
  }
  if (wordsInput.value === '' || !Number.isInteger(words) || words < 50 || words > 1000) {
    errors.push('Words per page must be a whole number from 50 to 1000.');
    wordsInput.classList.add('invalid');
  }
  if (minutesInput.value === '' || !Number.isInteger(minutes) || minutes < 5 || minutes > 600) {
    errors.push('Reading time per day must be a whole number from 5 to 600 minutes.');
    minutesInput.classList.add('invalid');
  }
  if (errors.length > 0) {
    showErrors(calcMessage, errors);
    return;
  }
  hideMessage(calcMessage);

  const r = calculateReadingTime(pages, words, speed, minutes);

  // Show the result in a table with labels and units
  calcResult.innerHTML = `
    <table class="result-table">
      <tr><td>Book</td><td>${escapeHTML(selectedBook ? selectedBook.title : '-')}</td></tr>
      <tr><td>Total words (pages &times; words per page)</td><td>${r.totalWords.toLocaleString()} words</td></tr>
      <tr><td>Total reading time (words &divide; ${speed} words/min)</td><td>${formatMinutes(r.totalMinutes)} (${r.totalMinutes.toFixed(1)} minutes)</td></tr>
      <tr><td>Days to finish (at ${minutes} min/day)</td><td>${r.days} day${r.days === 1 ? '' : 's'}</td></tr>
      <tr><td>Pages to read per day</td><td>about ${r.pagesPerDay} pages/day</td></tr>
      <tr><td>Estimated finish date (if you start today)</td><td>${formatDate(r.finishDate)}</td></tr>
    </table>`;
});
