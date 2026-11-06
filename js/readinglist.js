// ==========================================================
// readinglist.js - PAGE 3: My Reading List (CRUD + Local Storage)
// ==========================================================

const bookForm     = document.getElementById('bookForm');
const formTitle    = document.getElementById('formTitle');
const saveBtn      = document.getElementById('saveBtn');
const cancelBtn    = document.getElementById('cancelBtn');
const formMessage  = document.getElementById('formMessage');
const listMessage  = document.getElementById('listMessage');
const listBody     = document.getElementById('listBody');
const filterSelect = document.getElementById('filter');

const titleInput   = document.getElementById('title');
const authorInput  = document.getElementById('bookAuthor');
const pagesInput   = document.getElementById('pages');
const currentInput = document.getElementById('currentPage');
const statusSelect = document.getElementById('status');
const ratingSelect = document.getElementById('myRating');
const notesInput   = document.getElementById('notes');

let editingId = null;   // null = adding a new book, otherwise = id being edited

// Reading speed used for "time left": 250 words per page / 200 words per minute
const WORDS_PER_PAGE = 250;
const WORDS_PER_MINUTE = 200;

// ---------- READ: draw the table ----------
function renderList() {
  const all = ReadingList.getAll();
  const filter = filterSelect.value;
  const shown = filter === 'all' ? all : all.filter(r => r.status === filter);

  listBody.innerHTML = '';
  if (shown.length === 0) {
    const text = all.length === 0
      ? 'Your reading list is empty. Add a book with the form above, or from the Book Search / Book Suggestions pages.'
      : `No books with the status "${STATUS_LABELS[filter]}".`;
    listBody.innerHTML = `<tr><td colspan="7" class="empty">${text}</td></tr>`;
  }

  shown.forEach(record => {
    const percent = record.getProgressPercent();
    const minutesLeft = record.getPagesLeft() * WORDS_PER_PAGE / WORDS_PER_MINUTE;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="cell-cover">${coverHTML(record.coverUrl, record.title)}</td>
      <td>
        <strong>${escapeHTML(record.title)}</strong><br>
        ${escapeHTML(record.author)}
        ${record.reason ? `<div class="note">Suggested because: ${escapeHTML(record.reason)}</div>` : ''}
        ${record.notes ? `<div class="note">Notes: ${escapeHTML(record.notes)}</div>` : ''}
      </td>
      <td><span class="status ${record.status}">${STATUS_LABELS[record.status]}</span></td>
      <td>
        Page ${record.currentPage} of ${record.pages} (${percent}%)
        <div class="progress"><div class="bar-${record.id}"></div></div>
        ${record.getPagesLeft()} pages left
      </td>
      <td>${record.getPagesLeft() === 0 ? 'Done!' : formatMinutes(minutesLeft)}</td>
      <td>${record.myRating ? '★'.repeat(record.myRating) : '-'}</td>
      <td>
        <button type="button" class="small" data-edit="${record.id}">Edit</button>
        <button type="button" class="small danger" data-delete="${record.id}">Delete</button>
      </td>`;
    listBody.appendChild(row);
    // set the progress bar width with JavaScript (no inline style in the HTML)
    row.querySelector(`.bar-${record.id}`).style.width = percent + '%';
  });
  attachCoverFallback(listBody);
  updateSummary(all);
}

// ---------- Calculation: summary numbers for the whole list ----------
function updateSummary(records) {
  let finished = 0;
  let pagesRead = 0;
  let pagesLeft = 0;
  records.forEach(r => {
    if (r.status === 'finished') finished++;
    pagesRead += r.currentPage;
    pagesLeft += r.getPagesLeft();
  });
  const minutesLeft = pagesLeft * WORDS_PER_PAGE / WORDS_PER_MINUTE;

  document.getElementById('sumBooks').textContent = records.length;
  document.getElementById('sumFinished').textContent = finished;
  document.getElementById('sumPagesRead').textContent = `${pagesRead.toLocaleString()} pages`;
  document.getElementById('sumTimeLeft').textContent = pagesLeft === 0 ? '0 minutes' : formatMinutes(minutesLeft);
}

// Read the form into a plain object
function readForm() {
  return {
    title: titleInput.value,
    author: authorInput.value,
    pages: pagesInput.value === '' ? NaN : Number(pagesInput.value),
    currentPage: currentInput.value === '' ? 0 : Number(currentInput.value),
    status: statusSelect.value,
    myRating: ratingSelect.value,
    notes: notesInput.value
  };
}

function resetForm() {
  bookForm.reset();
  currentInput.value = 0;
  editingId = null;
  formTitle.textContent = 'Add a book manually';
  saveBtn.textContent = 'Add Book';
  cancelBtn.classList.add('hidden');
  [titleInput, pagesInput, currentInput].forEach(i => i.classList.remove('invalid'));
}

// ---------- EVENT 1: Form submit = CREATE or UPDATE ----------
bookForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = readForm();

  // Make status and current page agree with each other
  if (data.status === 'finished' && Number.isInteger(data.pages)) {
    data.currentPage = data.pages;              // finished = read every page
  } else if (data.status === 'plan' && data.currentPage > 0) {
    data.status = 'reading';                    // already started = reading
  }

  // Highlight the wrong fields in red
  titleInput.classList.toggle('invalid', data.title.trim() === '');
  pagesInput.classList.toggle('invalid', !Number.isInteger(data.pages) || data.pages < 1 || data.pages > 10000);
  currentInput.classList.toggle('invalid', !Number.isInteger(data.currentPage) || data.currentPage < 0 ||
                                          (Number.isInteger(data.pages) && data.currentPage > data.pages));

  const result = editingId === null
    ? ReadingList.add(data)                     // CREATE
    : ReadingList.update(editingId, data);      // UPDATE

  if (!result.ok) {
    showErrors(formMessage, result.errors);
    return;
  }

  const action = editingId === null ? 'added to' : 'updated in';
  showMessage(formMessage, `"<strong>${escapeHTML(result.record.title)}</strong>" was ${action} your reading list.`, 'success');
  resetForm();
  renderList();
});

// ---------- EVENT 2: Cancel editing ----------
cancelBtn.addEventListener('click', () => {
  resetForm();
  showMessage(formMessage, 'Edit cancelled. No changes were saved.', 'info');
});

// ---------- EVENT 3: Edit / Delete buttons in the table ----------
listBody.addEventListener('click', (event) => {
  const editBtn = event.target.closest('button[data-edit]');
  const deleteBtn = event.target.closest('button[data-delete]');

  if (editBtn) {
    const record = ReadingList.findById(editBtn.dataset.edit);
    if (!record) { showMessage(listMessage, 'This book no longer exists.', 'error'); renderList(); return; }
    // Fill the form with the saved values (DOM)
    editingId = record.id;
    titleInput.value = record.title;
    authorInput.value = record.author;
    pagesInput.value = record.pages;
    currentInput.value = record.currentPage;
    statusSelect.value = record.status;
    ratingSelect.value = record.myRating || '';
    notesInput.value = record.notes;
    formTitle.textContent = `Edit book: ${record.title}`;
    saveBtn.textContent = 'Update Book';
    cancelBtn.classList.remove('hidden');
    showMessage(formMessage, 'Change the details below, then click <strong>Update Book</strong>.', 'info');
    bookForm.scrollIntoView({ behavior: 'smooth' });
    titleInput.focus();
  }

  if (deleteBtn) {
    const record = ReadingList.findById(deleteBtn.dataset.delete);
    if (!record) return;
    // DELETE (ask first)
    if (!confirm(`Delete "${record.title}" from your reading list?\nThis cannot be undone.`)) {
      showMessage(listMessage, 'Delete cancelled.', 'info');
      return;
    }
    ReadingList.remove(record.id);
    if (editingId === record.id) resetForm();
    showMessage(listMessage, `"<strong>${escapeHTML(record.title)}</strong>" was deleted from your reading list.`, 'success');
    renderList();
  }
});

// ---------- EVENT 4: Filter dropdown ----------
filterSelect.addEventListener('change', () => {
  hideMessage(listMessage);
  renderList();
});

// ---------- EVENT 5: Choosing "Finished" fills in the current page ----------
statusSelect.addEventListener('change', () => {
  if (statusSelect.value === 'finished' && pagesInput.value !== '') {
    currentInput.value = pagesInput.value;
  } else if (statusSelect.value === 'plan') {
    currentInput.value = 0;
  }
});

// Show the saved list when the page opens
renderList();
