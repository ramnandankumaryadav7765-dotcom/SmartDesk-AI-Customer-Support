# SmartDesk — AI Customer Support

SmartDesk is a learning project for a small-shop support workspace. It brings a ticket inbox, order records, a shop knowledge base, and AI-assisted reply drafts together. MongoDB stores the shop data, and Gemini can draft replies and request a safe order lookup through the backend.

## Current features

- Overview dashboard with support and order summaries
- Ticket inbox with open, urgent, and resolved views
- Create a ticket, update its status, and save replies to its timeline
- Recent orders and sample shop knowledge articles
- AI reply drafts grounded in the knowledge base
- Gemini function calling for order status lookups; the server executes the lookup
- Demo mode with sample data when MongoDB is not configured

Replies are saved inside SmartDesk only. The app does not send email or contact customers.

## Start the app

You need Node.js 20 or newer. In this folder, install the dependencies and start both the API and website:

```sh
npm install
npm --prefix server install
npm --prefix client install
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`.

The website and API can run in demo mode without credentials. Sample tickets and orders are held in memory in demo mode, so changes reset when the server restarts.

## Connect MongoDB Atlas

1. Create a MongoDB Atlas cluster and database user.
2. Copy `server/.env.example` to `server/.env`.
3. Add the Atlas connection string to `MONGODB_URI` and optionally change `MONGODB_DB`.
4. Restart the server. SmartDesk creates sample collections only when each collection is empty.

Keep `server/.env` private. It is excluded from Git.

## Connect Gemini

1. Create a Gemini API key in Google AI Studio.
2. Add it as `GEMINI_API_KEY` in `server/.env`.
3. Leave `GEMINI_MODEL` set to `gemini-3.8-flash`, or change it to a model enabled for your API key.
4. Restart the server and use **Draft with AI** on a ticket.

Without a key, the assistant uses a clearly labeled preview mode with a simple sample-data response. Use fake customer information while experimenting with a free-tier API account.

## Keep the code tidy

Run `npm run format` to apply the project’s shared Prettier style. Run `npm run format:check` to check formatting without changing files. The browser app is served by Vite and reloads frontend edits as you work. Restart the API after changing server files.

## Project layout

```text
client/
  index.html                 App document and page metadata
  src/App.jsx                Page state and high-level routing
  src/api/smartdesk.js       Browser-to-server API calls
  src/components/            Shared sidebar, top bar, modal, and toast
  src/components/pages/       Overview, inbox, orders, and knowledge pages
  src/lib/formatters.js       Shared date, amount, and avatar helpers
  src/styles/                 Base, shell, page, overlay, and responsive CSS
  vite.config.js              React setup and local API proxy
server/
  src/index.js               Server startup and graceful shutdown
  src/app.js                  Express middleware and API mounting
  src/routes/api.js           HTTP routes and request validation
  src/services/assistant.js   Gemini prompts and order lookup tool
  src/store.js                MongoDB connection and demo data storage
  src/data.js                 Sample shop records and data builders
```
