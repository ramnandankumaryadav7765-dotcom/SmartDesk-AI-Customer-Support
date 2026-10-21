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

New accounts start with empty workspace data. The app does not seed sample customers, orders, or policies. Records from the earlier demo that have no account owner remain in MongoDB but are not shown to signed-in accounts.

## Start the app

Use Node.js 20 or newer. From this folder, install dependencies and run both the API server and browser app:

```sh
npm install
npm --prefix server install
npm --prefix client install
npm run dev
```

Open `http://localhost:5173`. The first screen is sign-in; choose **Create an account** to create a private workspace.

## Environment settings

The backend reads `server/.env`. Copy `server/.env.example` to `server/.env`, then set your MongoDB Atlas URI and Gemini API key:

```env
PORT=4000
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB=SmartDesk-AI-Customer-Support
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

Keep `server/.env` private. It is excluded from Git. Restart the server after changing settings.

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
