# Dev Course Tracker

A collection of learning roadmaps and checklists for various development technologies with **GitHub-synced progress tracking**.

<!-- Dynamic Progress Badge - Updates automatically when progress.json changes -->
![Overall Progress](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/Harshal750254/Planning/main/progress.json&query=$.completed&suffix=%20completed&label=Overall%20Progress&color=6366f1)

## Contents

### Python FastAPI (NEW)
Complete 6-week intensive learning plan for FastAPI development.

- **[Weekly Schedule](python-fastapi/Website/index.html)** - 6-week learning roadmap with checkboxes
- **[FastAPI Concepts](python-fastapi/Website/concepts.html)** - Priority-based concept cards (P0-P4)
- **[Python Core](python-fastapi/Website/python-core.html)** - Python fundamentals for backend
- **[PostgreSQL](python-fastapi/Website/postgresql.html)** - Database concepts from basics to advanced

### Java Spring Boot
Complete 6-week intensive learning plan for Spring Boot development.

- **[Weekly Schedule](java-springboot/Website/index.html)** - 6-week learning roadmap with checkboxes
- **[Spring Concepts](java-springboot/Website/concepts.html)** - Priority-based concept cards (P0-P8)
- **[Java Core](java-springboot/Website/java-core.html)** - Java fundamentals for backend
- **[Learning Roadmap](java-springboot/SpringBootLearningPlanRoadmap.html)** - Alternative visual roadmap

## Features

- **Interactive Checklists** - Track your progress through each topic
- **GitHub Sync** - Progress automatically saves to this repository
- **Cross-Device** - Your progress syncs across all devices
- **Offline Support** - Works offline, syncs when back online

## Setup GitHub Progress Sync

To enable automatic progress syncing to your GitHub repository:

### 1. Create a GitHub OAuth App

1. Go to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name**: `Dev Course Progress App` (or any name)
   - **Homepage URL**: `https://Harshal750254.github.io/Planning`
   - **Authorization callback URL**: `https://Harshal750254.github.io/Planning`
   - **Enable Device Flow**: Check this checkbox!
4. Click **"Register application"**
5. Copy the **Client ID** (you won't need the Client Secret for Device Flow)

### 2. Update Configuration

Edit `python-fastapi/Website/github-sync.js` AND `java-springboot/Website/github-sync.js` and update:

```javascript
const GITHUB_CONFIG = {
    clientId: 'YOUR_CLIENT_ID_HERE',      // Paste the Client ID from step 1
    owner: 'Harshal750254',               // Already set
    repo: 'Planning',                      // Already set
    progressPath: 'progress.json',         // Shared progress file at root
    branch: 'main'
};
```

> Note: Both learning tracks share the same progress file, so your overall progress is tracked together.

### 3. Enable GitHub Pages (Optional)

To access your tracker from anywhere:

1. Go to your repository **Settings > Pages**
2. Under "Source", select **"Deploy from a branch"**
3. Select `main` branch and `/ (root)` folder
4. Click **Save**
5. Your site will be live at `https://Harshal750254.github.io/Planning`

### 4. Sign In

1. Open the tracker website
2. Click **"Sign in"** in the navigation bar
3. Enter the code shown on GitHub's device activation page
4. Your progress will now sync automatically!

## Usage

Open the HTML files in your browser to access the interactive learning materials. Your progress is automatically saved locally and synced to GitHub when signed in.

## Structure

```
Planning/
├── index.html              # Main landing page
├── progress.json           # Shared progress data (synced to GitHub)
├── README.md
├── python-fastapi/
│   └── Website/
│       ├── index.html        # Weekly schedule
│       ├── concepts.html     # FastAPI concepts
│       ├── python-core.html  # Python fundamentals
│       ├── postgresql.html   # PostgreSQL basics
│       └── github-sync.js    # Sync functionality
└── java-springboot/
    ├── SpringBootLearningPlanRoadmap.html
    └── Website/
        ├── index.html        # Weekly schedule
        ├── concepts.html     # Spring concepts
        ├── java-core.html    # Java fundamentals
        └── github-sync.js    # Sync functionality
```
