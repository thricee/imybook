// ==========================================================
// common.js - small helper functions used by every page
// ==========================================================

// Shows a coloured message box. type = success | error | info | warning
function showMessage(element, text, type) {
  element.className = `message show ${type}`;
  element.innerHTML = text;
}

function hideMessage(element) {
  element.className = 'message';
  element.innerHTML = '';
}

// Shows a list of error messages as bullet points
function showErrors(element, errors) {
  const items = errors.map(e => `<li>${escapeHTML(e)}</li>`).join('');
  showMessage(element, `<strong>Please fix the following:</strong><ul>${items}</ul>`, 'error');
}

// Stops API text from being run as HTML (security)
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// ---------- READING TIME CALCULATION ----------
// totalWords   = pages x words per page
// totalMinutes = totalWords / reading speed (words per minute)
// days         = totalMinutes / minutes read per day (rounded UP)
function calculateReadingTime(pages, wordsPerPage, wordsPerMinute, minutesPerDay) {
  const totalWords = pages * wordsPerPage;
  const totalMinutes = totalWords / wordsPerMinute;
  const days = Math.ceil(totalMinutes / minutesPerDay);

  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + days);

  return {
    totalWords,
    totalMinutes,
    days,
    pagesPerDay: Math.ceil(pages / days),
    finishDate
  };
}

// Turns 135.4 minutes into "2 hours 15 minutes"
function formatMinutes(minutes) {
  const rounded = Math.round(minutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m} minute${m === 1 ? '' : 's'}`;
  return `${h} hour${h === 1 ? '' : 's'} ${m} minute${m === 1 ? '' : 's'}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

// Builds the cover <img>, or a grey box when the book has no cover
function coverHTML(url, title) {
  if (!url) return '<div class="no-cover">No cover</div>';
  return `<img class="cover" src="${url}" alt="Cover of ${escapeHTML(title)}">`;
}

// If a cover picture fails to load, swap it for the grey "No cover" box
function attachCoverFallback(container) {
  container.querySelectorAll('img.cover').forEach(img => {
    img.addEventListener('error', () => {
      const box = document.createElement('div');
      box.className = 'no-cover';
      box.textContent = 'No cover';
      img.replaceWith(box);
    });
  });
}
