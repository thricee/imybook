# 🍼 iMyBook – The Super Easy Deployment Guide

Follow the steps **in order**. Do one step, check it worked ✅, then go to the next one.
Do not skip any step.

---

## 🧸 PART A – Things you need (do this only ONCE)

### Step 1: Install Node.js
Node.js is the engine that runs the app.

1. Open your web browser (Chrome).
2. Go to **https://nodejs.org**
3. Click the big green button that says **LTS**.
4. Open the file you downloaded.
5. Keep clicking **Next** ➡️ **Next** ➡️ **Install** ➡️ **Finish**. (Do not change anything.)

✅ **Check:** Press the **Windows key**, type `cmd`, press **Enter**. A black window opens. Type this and press **Enter**:

```bash
node -v
```

If you see a number like `v22.11.0`, it worked! 🎉 Close the black window.

### Step 2: Install Git
Git is the tool that uploads your project to GitHub.

1. Go to **https://git-scm.com/download/win**
2. Click **Click here to download**.
3. Open the file. Keep clicking **Next** until **Install**, then **Finish**.

✅ **Check:** Open `cmd` again and type:

```bash
git --version
```

If you see `git version 2.xx`, it worked! 🎉

### Step 3: Install Visual Studio Code (skip if you already have it)
1. Go to **https://code.visualstudio.com**
2. Download, open, click **Next** until **Finish**.

---

## 📁 PART B – Put the project on your computer

### Step 4: Put the folder somewhere easy
Put the **iMyBook** folder on your **Desktop**.

Inside it you should see these things:

```
iMyBook
├── css
├── js
├── index.html
├── suggest.html
├── reading-list.html
├── main.js
├── package.json
├── README.md
└── DEPLOYMENT_GUIDE.md
```

### Step 5: Open the folder in VS Code
1. Open **Visual Studio Code**.
2. Click **File** ➡️ **Open Folder...**
3. Click **Desktop** ➡️ click **iMyBook** ➡️ click **Select Folder**.
4. If it asks *"Do you trust the authors?"* click **Yes, I trust the authors**.

### Step 6: Open the Terminal (the typing box)
1. At the top of VS Code, click **Terminal** ➡️ **New Terminal**.
2. A box appears at the bottom. **This is where you type commands.**

💡 Tip: To run a command, type it (or copy-paste it) and press **Enter**.

---

## ▶️ PART C – Run the app

### Step 7: Download the app's parts (only the first time)
In the terminal, type:

```bash
npm install
```

⏳ Wait. It can take 1–5 minutes. It downloads Electron (about 100 MB).
When you see the blinking cursor again, it is done. A new folder called **node_modules** appears. That is normal. 👍

> ⚠️ If you see a yellow message about **allow-scripts** or **approve-scripts**, type this, press Enter, and wait:
> ```bash
> npm approve-scripts electron
> ```

### Step 8: Start the app 🚀

```bash
npm start
```

🎉 **The iMyBook window opens!**

### Step 9: Try every feature (do this before you take screenshots for your report)

**Page 1 – Book Search**
1. Type `Harry Potter` ➡️ click **Search**. Book cards appear.
2. Click **View Details** on a book. You see the cover, author, year, pages, rating, editions, subjects and description.
3. Scroll down to **Reading Time Calculator** ➡️ click **Calculate**. You see total words, reading time, days to finish and finish date.
4. Click **+ Add to My Reading List**. A green message appears.
5. Try the errors: click **Search** with an empty box (red message). Type `0` in Total pages and click **Calculate** (red message).

**Page 2 – Book Suggestions**
1. Click **Book Suggestions** at the top.
2. Choose Genre = **Fantasy**, Book length = **Medium** ➡️ click **Suggest Books**.
3. Each card shows **Why** it was suggested. Click **+ Add to Reading List** on one.
4. Look at **Previous suggestions** at the bottom – they are saved.
5. Try the "no result" message: Genre = **Self-Help**, Length = **Long**, What matters most = **Classic books** ➡️ **Suggest Books**.

**Page 3 – My Reading List**
1. Click **My Reading List** at the top. Your books are in the table. (**Read**)
2. Fill in the form (Title, Total pages) ➡️ click **Add Book**. (**Create**)
3. Click **Edit** on a book ➡️ change Current page ➡️ click **Update Book**. (**Update**)
4. Click **Delete** on a book ➡️ click **OK**. (**Delete**)
5. **Close the app**, then type `npm start` again. Your books are still there! ✅

To stop the app: close the window (or click the terminal and press **Ctrl + C**).

---

## 📦 PART D – Make a real app (.exe) you can double-click

### Step 10: Build the .exe

```bash
npm run package
```

⏳ Wait about 1 minute.

### Step 11: Find your app
1. In File Explorer go to **Desktop ➡️ iMyBook ➡️ dist ➡️ iMyBook-win32-x64**
2. Double-click **iMyBook.exe** 🎉

💡 Want to give it to a friend? Right-click the **iMyBook-win32-x64** folder ➡️ **Compress to ZIP file** ➡️ send the ZIP. They unzip it and double-click **iMyBook.exe**. (They must send the **whole folder**, not only the .exe.)

---

## ☁️ PART E – Upload to GitHub (needed for Task 10)

### Step 12: Make a GitHub account
1. Go to **https://github.com** ➡️ **Sign up**. (Skip if you already have one.)

### Step 13: Make an empty repository (a "box" for your code)
1. Log in to GitHub.
2. Click the **+** at the top right ➡️ **New repository**.
3. Repository name: `imybook`
4. Choose **Public** (so your lecturer can open it).
5. ❗ Do **NOT** tick "Add a README file".
6. Click **Create repository**.
7. Keep this page open. You will need the link that looks like
   `https://github.com/YOUR-USERNAME/imybook.git`

### Step 14: Tell Git who you are (only the first time ever)
In the VS Code terminal, type these two lines (use **your** name and the email of your GitHub account):

```bash
git config --global user.name "Your Name"
```

```bash
git config --global user.email "you@example.com"
```

### Step 15: Upload! Type these one by one, pressing Enter after each

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "iMyBook final project"
```

```bash
git branch -M main
```

Now replace `YOUR-USERNAME` with your GitHub username:

```bash
git remote add origin https://github.com/YOUR-USERNAME/imybook.git
```

```bash
git push -u origin main
```

A window may pop up asking you to log in to GitHub ➡️ click **Sign in with your browser** ➡️ **Authorize**.

### Step 16: Check it worked ✅
1. Refresh your GitHub page.
2. You should see `css`, `js`, `index.html`, `package.json`, `README.md` ...
3. You should **NOT** see `node_modules` or `dist` (they are skipped on purpose by the `.gitignore` file – that is correct!).
4. Copy the link from the address bar (e.g. `https://github.com/YOUR-USERNAME/imybook`) and paste it in your **report**.

### Step 17: Changed something later? Upload again with:

```bash
git add .
```

```bash
git commit -m "Update"
```

```bash
git push
```

---

## 🆘 PART F – Help! Something went wrong

| What you see 😟 | What to do 🙂 |
|---|---|
| `'node' is not recognized` or `'npm' is not recognized` | Node.js is not installed, or VS Code was open while installing. Close VS Code, open it again. If still wrong, redo Step 1. |
| `'git' is not recognized` | Redo Step 2, then close and reopen VS Code. |
| `npm start` says `electron is not recognized` / `Cannot find module` | You forgot Step 7. Type `npm install` first. |
| `Electron failed to install correctly` | Type `npm approve-scripts electron`, then `npm install`, then `npm start`. |
| `ENOENT: no such file or directory, package.json` | The terminal is in the wrong folder. Do Step 5 again (open the **iMyBook** folder itself). |
| The app says **"Cannot connect to the book server"** | Check your Wi-Fi/internet, then click Search again. |
| The app says **"took too long to reply"** | The Open Library website is slow right now. Wait a few seconds and try again. |
| `error: remote origin already exists` | Type `git remote set-url origin https://github.com/YOUR-USERNAME/imybook.git` then `git push -u origin main`. |
| `failed to push` / `rejected` | You ticked "Add a README" in Step 13. Type `git pull origin main --allow-unrelated-histories --no-edit`, then `git push -u origin main`. |
| My reading list is empty after I moved to another computer | That is normal. Local Storage is saved on **each** computer separately. |

🎉 **You did it! Well done!**
