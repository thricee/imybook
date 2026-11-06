# iMyBook – Reading Book Application

CSC2923 Object Oriented Programming – Final Project

iMyBook is an Electron desktop application that helps readers find books, get book suggestions, calculate how long a book takes to read, and manage their own reading list.

## How to run

```bash
npm install
npm start
```

To build a Windows `.exe`: `npm run package` (output goes to `dist/iMyBook-win32-x64/iMyBook.exe`).

Full beginner steps are in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Pages

| Page | File | Purpose |
|---|---|---|
| Book Search | `index.html` + `js/search.js` | Search Open Library by title, author or keyword, view book details, run the Reading Time Calculator, add a book to the reading list |
| Book Suggestions | `suggest.html` + `js/suggest.js` | Suggest books by genre, length, priority and favourite author, and keep a saved history of suggestions |
| My Reading List | `reading-list.html` + `js/readinglist.js` | Create, view, update and delete saved books, with progress and reading-time summary |

## APIs used (no API key needed)

| API | URL | Information retrieved |
|---|---|---|
| Open Library Search API | `https://openlibrary.org/search.json` | Title, author(s), first publish year, number of pages, reader rating, number of editions, subjects/genre |
| Open Library Works API | `https://openlibrary.org/works/{id}.json` | Book description / summary |
| Open Library Covers API | `https://covers.openlibrary.org/b/id/{id}-M.jpg` | Book cover picture |

## Where each requirement is in the code

| Requirement | Location |
|---|---|
| Classes (OOP) | `Book`, `BookAPI` in `js/api.js`; `ReadingRecord`, `ReadingList`, `SuggestionHistory` in `js/storage.js` |
| API request + JSON processing | `BookAPI.fetchJSON`, `searchBooks`, `searchBySubject`, `getDescription` in `js/api.js` |
| Suggestion logic (switch / if...else) | `getGenreInfo`, `matchesLength`, `suggestBooks`, `noSuggestionMessage` in `js/suggest.js` |
| Calculation | `calculateReadingTime` in `js/common.js` (total words, reading time, days to finish, pages/day, finish date); progress % and pages left in `ReadingRecord`; list summary in `updateSummary` (`js/readinglist.js`) |
| CRUD + Local Storage | `ReadingList.add / getAll / update / remove` in `js/storage.js` (key `imybook.readingList`); suggestions saved by `SuggestionHistory` (key `imybook.suggestions`) |
| Input validation | `ReadingRecord.validate`, search text check, calculator range checks, suggestion form checks |
| Error handling | no internet, timeout (with 1 automatic retry), HTTP error, unreadable JSON, empty results, no suitable suggestion, duplicate book, invalid input |
| DOM manipulation | result cards, details panel, calculator table, suggestion cards, history list, reading-list table, summary numbers, progress bars, message boxes |
| Event handling | form submits, button clicks (view, add, edit, delete, clear, cancel), dropdown `change` (search type, filter, status), `input` events |

## Calculation formula

```
total words      = total pages × words per page
reading minutes  = total words ÷ reading speed (words per minute)
days to finish   = reading minutes ÷ minutes read per day   (rounded up)
finish date      = today + days to finish
```

Example: 302 pages × 250 words = 75,500 words ÷ 200 words/min = 377.5 min (6 hours 18 minutes). At 30 min/day that is 13 days.
