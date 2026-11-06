// ==========================================================
// suggest.js - PAGE 2: Book Suggestions
// The API only gives a list of books. The SUGGESTION LOGIC below
// (switch + if...else) is written by the student to choose the
// best books for the user's genre, length, priority and author.
// ==========================================================

const suggestForm     = document.getElementById('suggestForm');
const genreSelect     = document.getElementById('genre');
const lengthSelect    = document.getElementById('length');
const prioritySelect  = document.getElementById('priority');
const authorInput     = document.getElementById('author');
const suggestBtn      = document.getElementById('suggestBtn');
const suggestMessage  = document.getElementById('suggestMessage');
const loading         = document.getElementById('loading');
const suggestBox      = document.getElementById('suggestBox');
const suggestTitle    = document.getElementById('suggestTitle');
const suggestionsDiv  = document.getElementById('suggestions');
const historyDiv      = document.getElementById('history');
const historyMessage  = document.getElementById('historyMessage');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const MAX_SUGGESTIONS = 8;
let lastSuggestions = [];   // [{ book, reason }]

// ---------- switch: convert the chosen genre into an Open Library subject ----------
function getGenreInfo(genre) {
  switch (genre) {
    case 'fantasy':     return { subject: 'fantasy',          label: 'Fantasy' };
    case 'scifi':       return { subject: 'science_fiction',  label: 'Science Fiction' };
    case 'mystery':     return { subject: 'mystery',          label: 'Mystery & Detective' };
    case 'romance':     return { subject: 'romance',          label: 'Romance' };
    case 'horror':      return { subject: 'horror',           label: 'Horror' };
    case 'history':     return { subject: 'history',          label: 'History' };
    case 'biography':   return { subject: 'biography',        label: 'Biography' };
    case 'selfhelp':    return { subject: 'self-help',        label: 'Self-Help' };
    case 'programming': return { subject: 'computer_programming', label: 'Programming / Computers' };
    case 'children':    return { subject: 'juvenile_fiction', label: "Children's Books" };
    default:            return null;   // genre not recognised
  }
}

// ---------- if...else: does the book match the chosen length? ----------
function matchesLength(book, length) {
  if (length === 'any') return true;
  if (book.pages === null) return false;          // cannot check length without pages
  if (length === 'short') return book.pages < 200;
  else if (length === 'medium') return book.pages >= 200 && book.pages <= 400;
  else if (length === 'long') return book.pages > 400;
  return false;
}

function lengthLabel(length) {
  switch (length) {
    case 'short':  return 'short (under 200 pages)';
    case 'medium': return 'medium (200 - 400 pages)';
    case 'long':   return 'long (over 400 pages)';
    default:       return 'any length';
  }
}

// ---------- MAIN SUGGESTION LOGIC ----------
// Gives every book a score and a list of reasons, then returns the best ones.
function suggestBooks(books, criteria) {
  const picked = [];
  const counts = { length: 0, author: 0, era: 0 };   // why books were rejected

  for (const book of books) {
    // Condition 1: book length
    if (!matchesLength(book, criteria.length)) { counts.length++; continue; }

    // Condition 2: favourite author (if the user typed one)
    if (criteria.author !== '') {
      const found = book.authors.some(a => a.toLowerCase().includes(criteria.author.toLowerCase()));
      if (!found) { counts.author++; continue; }
    }

    // Condition 3: "classic" priority only accepts books published before 1950
    if (criteria.priority === 'classic' && (book.year === null || book.year >= 1950)) {
      counts.era++; continue;
    }

    let score = 0;
    const reasons = [`Matches ${criteria.genreLabel}`];

    // Reader rating
    if (book.rating === null) {
      reasons.push('Not rated yet');
    } else if (book.rating >= 4.0) {
      score += 3; reasons.push(`Highly rated (${book.rating.toFixed(1)}/5)`);
    } else if (book.rating >= 3.5) {
      score += 2; reasons.push(`Well rated (${book.rating.toFixed(1)}/5)`);
    } else {
      score += 1; reasons.push(`Rated ${book.rating.toFixed(1)}/5`);
    }

    // Popularity (number of editions)
    if (book.editionCount >= 100) {
      score += 3; reasons.push(`Very popular (${book.editionCount} editions)`);
    } else if (book.editionCount >= 20) {
      score += 2; reasons.push(`Popular (${book.editionCount} editions)`);
    } else {
      score += 1;
    }

    // Length
    if (book.pages !== null) reasons.push(`${book.getLengthCategory()} read (${book.pages} pages)`);
    if (criteria.author !== '') reasons.push(`By your favourite author`);

    // Extra points depending on what the user said matters most
    switch (criteria.priority) {
      case 'rating':
        score += book.rating !== null ? book.rating * 2 : 0;
        break;
      case 'popular':
        score += Math.min(book.editionCount / 25, 10);
        break;
      case 'newest':
        if (book.year !== null && book.year >= 2010) { score += 6; reasons.push(`Recent (${book.year})`); }
        else if (book.year !== null && book.year >= 2000) { score += 3; reasons.push(`Modern (${book.year})`); }
        break;
      case 'classic':
        score += 4; reasons.push(`Classic (${book.year})`);
        break;
    }

    picked.push({ book, score, reason: reasons.join(' • ') });
  }

  // Sort from highest score to lowest and keep the top results
  picked.sort((a, b) => b.score - a.score);
  return { list: picked.slice(0, MAX_SUGGESTIONS), counts };
}

// Explains WHY there were no suggestions (fallback message)
function noSuggestionMessage(criteria, counts) {
  let tip;
  if (counts.author > 0 && counts.author >= counts.length) {
    tip = `No ${criteria.genreLabel} books by "${escapeHTML(criteria.author)}" were found. Check the spelling or leave the author box empty.`;
  } else if (counts.length > 0 && criteria.length !== 'any') {
    tip = `No ${criteria.genreLabel} books are ${lengthLabel(criteria.length)}. Try choosing "Any length".`;
  } else if (counts.era > 0) {
    tip = `No classic ${criteria.genreLabel} books (before 1950) were found. Try another priority.`;
  } else {
    tip = 'Try another genre or remove some choices.';
  }
  return `<strong>Sorry, no suitable book could be suggested.</strong> ${tip}`;
}

// ---------- EVENT 1: Suggest form submitted ----------
suggestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const genreInfo = getGenreInfo(genreSelect.value);
  const author = authorInput.value.trim();

  // Validation
  const errors = [];
  genreSelect.classList.remove('invalid');
  authorInput.classList.remove('invalid');
  if (!genreInfo) {
    errors.push('Please choose a genre.');
    genreSelect.classList.add('invalid');
  }
  if (author !== '' && (author.length < 2 || !/^[a-zA-Z .'\-]+$/.test(author))) {
    errors.push('Author name must have at least 2 letters and only contain letters, spaces, dots, hyphens or apostrophes.');
    authorInput.classList.add('invalid');
  }
  if (errors.length > 0) { showErrors(suggestMessage, errors); return; }

  const criteria = {
    genre: genreSelect.value,
    genreLabel: genreInfo.label,
    length: lengthSelect.value,
    priority: prioritySelect.value,
    author: author
  };

  hideMessage(suggestMessage);
  suggestBox.classList.add('hidden');
  loading.classList.add('show');
  suggestBtn.disabled = true;

  try {
    const books = await BookAPI.searchBySubject(genreInfo.subject, author);
    if (books.length === 0) {
      showMessage(suggestMessage, `The book server returned no ${genreInfo.label} books${author ? ' by "' + escapeHTML(author) + '"' : ''}. Try another genre or author.`, 'warning');
      return;
    }

    const result = suggestBooks(books, criteria);
    if (result.list.length === 0) {
      showMessage(suggestMessage, noSuggestionMessage(criteria, result.counts), 'warning');
      return;
    }

    lastSuggestions = result.list;
    renderSuggestions(result.list, criteria);
    saveToHistory(result.list, criteria);
    showMessage(suggestMessage, `We checked ${books.length} ${genreInfo.label} books and picked the best ${result.list.length} for you. The suggestions were saved below.`, 'success');
  } catch (err) {
    showMessage(suggestMessage, `<strong>Could not get suggestions:</strong> ${escapeHTML(err.message)}`, 'error');
  } finally {
    loading.classList.remove('show');
    suggestBtn.disabled = false;
  }
});

// ---------- DOM: draw suggestion cards ----------
function renderSuggestions(list, criteria) {
  suggestionsDiv.innerHTML = '';
  list.forEach((item, index) => {
    const book = item.book;
    // Estimated reading time at average speed (250 words/page, 200 words/min)
    const timeText = book.pages
      ? `About ${formatMinutes(calculateReadingTime(book.pages, 250, 200, 30).totalMinutes)} to read`
      : 'Reading time unknown';
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      ${coverHTML(book.getCoverUrl('M'), book.title)}
      <h4>#${index + 1} ${escapeHTML(book.title)}</h4>
      <p>${escapeHTML(book.getAuthorText())}</p>
      <p>${timeText}</p>
      <p class="reason"><strong>Why:</strong> ${escapeHTML(item.reason)}</p>
      <div class="actions">
        <button type="button" class="small primary" data-index="${index}">+ Add to Reading List</button>
      </div>`;
    suggestionsDiv.appendChild(card);
  });
  attachCoverFallback(suggestionsDiv);
  suggestTitle.textContent = `2. Suggested ${criteria.genreLabel} books (${lengthLabel(criteria.length)})`;
  suggestBox.classList.remove('hidden');
}

// ---------- EVENT 2: Add a suggested book to the reading list ----------
suggestionsDiv.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-index]');
  if (!button) return;
  const item = lastSuggestions[Number(button.dataset.index)];
  const book = item.book;

  if (!book.pages) {
    showMessage(suggestMessage, `"${escapeHTML(book.title)}" has no page count from the API. Add it on the <a href="reading-list.html">My Reading List</a> page and type the pages yourself.`, 'warning');
    return;
  }

  const result = ReadingList.add({
    workKey: book.workKey,
    title: book.title,
    author: book.getAuthorText(),
    pages: book.pages,
    status: 'plan',
    reason: item.reason,                 // the suggestion is stored in Local Storage too
    coverUrl: book.getCoverUrl('S'),
    source: 'suggestion'
  });

  if (result.ok) {
    button.textContent = '✓ Added';
    button.disabled = true;
    showMessage(suggestMessage, `"<strong>${escapeHTML(book.title)}</strong>" was added to <a href="reading-list.html">My Reading List</a>.`, 'success');
  } else {
    showErrors(suggestMessage, result.errors);
  }
  suggestMessage.scrollIntoView({ behavior: 'smooth' });
});

// ---------- Suggestion history (Local Storage) ----------
function saveToHistory(list, criteria) {
  SuggestionHistory.add({
    date: new Date().toISOString(),
    genre: criteria.genreLabel,
    length: lengthLabel(criteria.length),
    priority: prioritySelect.options[prioritySelect.selectedIndex].text,
    author: criteria.author,
    books: list.map(item => ({
      title: item.book.title,
      author: item.book.getAuthorText(),
      reason: item.reason
    }))
  });
  renderHistory();
}

function renderHistory() {
  const history = SuggestionHistory.getAll();
  if (history.length === 0) {
    historyDiv.innerHTML = '<p class="empty">No saved suggestions yet. Use the form above to get your first suggestions.</p>';
    clearHistoryBtn.classList.add('hidden');
    return;
  }
  clearHistoryBtn.classList.remove('hidden');
  historyDiv.innerHTML = history.map((entry, index) => `
    <div class="history-item">
      <p>
        <strong>${new Date(entry.date).toLocaleString('en-GB')}</strong> —
        ${escapeHTML(entry.genre)}, ${escapeHTML(entry.length)}, ${escapeHTML(entry.priority)}
        ${entry.author ? ', author: ' + escapeHTML(entry.author) : ''}
        <button type="button" class="small" data-delete="${index}">Delete</button>
      </p>
      <ol>${entry.books.map(b => `<li>${escapeHTML(b.title)} <em>by ${escapeHTML(b.author)}</em></li>`).join('')}</ol>
    </div>`).join('');
}

// EVENT 3: delete one history entry
historyDiv.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-delete]');
  if (!button) return;
  SuggestionHistory.remove(Number(button.dataset.delete));
  renderHistory();
  showMessage(historyMessage, 'Suggestion history entry deleted.', 'success');
});

// EVENT 4: clear all history
clearHistoryBtn.addEventListener('click', () => {
  if (!confirm('Delete ALL saved suggestions?')) return;
  SuggestionHistory.clear();
  renderHistory();
  showMessage(historyMessage, 'All saved suggestions were deleted.', 'success');
});

// EVENT 5: remove the red border as soon as the user fixes the input
genreSelect.addEventListener('change', () => genreSelect.classList.remove('invalid'));
authorInput.addEventListener('input', () => authorInput.classList.remove('invalid'));

// Show saved history when the page opens
renderHistory();
