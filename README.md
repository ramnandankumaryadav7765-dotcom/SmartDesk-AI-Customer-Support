# SmartDesk — AI Customer Support

SmartDesk is a learning project for a small-shop support workspace. Users create an account, then manage their own support tickets, orders, and knowledge articles. A workspace assistant can answer general questions and use only the signed-in account's data when responding about its records.

## Features

- Sign-up, sign-in, and sign-out with an HTTP-only session cookie
- Scrypt password hashing; passwords are never stored as plain text
- Account-scoped tickets, orders, and knowledge articles
- Create tickets, save internal replies, and resolve or reopen conversations
- Add orders and knowledge articles to your own workspace
- Gemini assistant for general questions and account-aware answers
- Gemini-generated ticket reply drafts with retry handling for temporary server overloads
- Responsive dashboard, inbox, orders, and knowledge views

New accounts start with empty workspace data. The app does not seed sample customers, orders, or policies. Legacy demo tickets, orders, and knowledge articles without an account owner have been removed from MongoDB.

## Start the app

Use Node.js 20 or newer. From this folder, install dependencies and run both the API server and browser app:

```sh
npm install
npm --prefix server install
npm --prefix client install
npm run dev
```

Open `http://localhost:5173`. The first screen is sign-in; choose **Create an account** to create a private workspace.

## Deploy to Render

Deploy this project as **one Render Web Service** from the repository root. The service builds the React client and serves it from Express alongside `/api`, keeping the website and API on the same origin so the session cookie works without cross-site cookie settings.

In Render, create a **New → Web Service** connected to this repository. Leave **Root Directory** blank and use:

```text
Build Command: npm ci && npm --prefix server ci --omit=dev && npm --prefix client ci --include=dev && npm --prefix client run build
Start Command: npm --prefix server start
```

Set these environment variables in the Render service:

```text
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
MONGODB_DB=SmartDesk-AI-Customer-Support
GEMINI_API_KEY=<your Gemini API key>
GEMINI_MODEL=gemini-3.8-flash
FIREBASE_PROJECT_ID=<your Firebase project ID>
FIREBASE_SERVICE_ACCOUNT_PATH=/etc/secrets/firebase-service-account.json
VITE_FIREBASE_API_KEY=<your Firebase web API key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your Firebase project ID>
VITE_FIREBASE_STORAGE_BUCKET=<your Firebase storage bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your Firebase sender ID>
VITE_FIREBASE_APP_ID=<your Firebase web app ID>
```

Upload the Firebase Admin key in **Environment → Secret Files** with filename `firebase-service-account.json` and the complete downloaded JSON as its contents. Do not upload that key to Git. Render provides `PORT` and `RENDER_EXTERNAL_URL`; the server uses the assigned port and automatically allows its own public URL. Add that same public hostname to **Firebase Authentication → Settings → Authorized domains** after the first deployment.

The client variables prefixed with `VITE_` are included in the browser build and are not private credentials. Never put the Gemini key, MongoDB URI, or Firebase Admin key in a `VITE_` variable.

## Environment settings

The backend reads `server/.env`. Copy `server/.env.example` to `server/.env`, then set your MongoDB Atlas URI, Gemini API key, and Firebase project ID:

```env
PORT=4000
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB=SmartDesk-AI-Customer-Support
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

Create `client/.env.local` from the Firebase web app configuration:

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-web-app-id
```

In Firebase Console, enable **Authentication → Sign-in method → Google** and add `localhost` to Authentication's authorized domains. Download a service account key from **Project settings → Service accounts → Generate new private key**, then place the JSON file at `server/firebase-service-account.json`. This file is ignored by Git and must remain private. Set `FIREBASE_PROJECT_ID` to the `project_id` in that JSON and the same project ID from the Firebase web app config. The client sends a Firebase ID token to the API, which verifies it with the Firebase Admin SDK before creating or signing into a SmartDesk session. Firebase's Google provider uses the basic identity profile; SmartDesk does not request Google Drive, Gmail, or other Google data scopes.

Keep `server/.env` and `server/firebase-service-account.json` private. Both are excluded from Git. `client/.env.local` is also excluded from Git. Restart both the app and server after changing settings.

Google sign-in creates a Firebase Auth identity and a SmartDesk account on first use. A verified Google email matching an existing SmartDesk account is linked to that account so its saved workspace data remains available. Google-only accounts do not store a password hash in MongoDB.

## Account data and AI

The API filters ticket, order, and knowledge operations by the signed-in account ID. The assistant receives only that account's saved workspace records and relevant policy articles. It cannot send replies or change records. Review its suggestions before taking action.

If `GEMINI_API_KEY` is not configured, account and data features still work, but AI answers are unavailable. Data is held in memory only when MongoDB is not configured; in that mode accounts and changes reset when the server stops.

## Keep the code tidy

Run `npm run format` to apply the shared Prettier style. Run `npm run format:check` to check formatting. Run `npm run build` to create the frontend production build.

## Project layout

```text
client/
  index.html                  App document and page metadata
  src/App.jsx                 Session, data, and page state
  src/api/smartdesk.js        Browser-to-server API calls
  src/components/AuthPage.jsx Login and signup
  src/components/Sidebar.jsx  Account navigation and sign-out
  src/components/pages/       Dashboard, inbox, orders, knowledge, assistant
  src/styles/                 Base, shell, page, responsive, and auth styles
  vite.config.js              React setup and local API proxy
server/
  src/index.js                Server startup and graceful shutdown
  src/app.js                  Express middleware and API mounting
  src/routes/api.js           Auth, account data, and assistant routes
  src/services/auth.js        Password hashing and session cookies
  src/services/assistant.js   Account-aware Gemini integration
  src/store.js                MongoDB and in-memory data access
  src/data.js                 Request-based record builders
```
