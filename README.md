# DentalCare

A responsive React home page backed by an Express API and MongoDB appointment storage. The frontend and backend have independent dependencies and npm scripts.

## Run locally

Install Node.js 20+ and MongoDB (local MongoDB or a MongoDB Atlas cluster). In two terminals:

```powershell
cd client
npm install
npm run dev
```

```powershell
cd server
npm install
Copy-Item .env.example .env
npm start
```

Vite serves the page at `http://localhost:5173` and proxies `/api` requests to Express on port `5000`. Set `MONGODB_URI` in `server/.env`.

For production, run `npm run build` in `client`, then start the backend with `npm start` in `server`. Express serves the built frontend from `client/dist` as well as the API.

## API

The page only calls `POST /api/appointments` when a visitor submits the booking form. It validates the request, stores it in MongoDB, and returns a confirmation reference. The unique date/time index prevents two requests from reserving the same slot; a conflict returns `409` so the visitor can choose another time. The site does not call third-party data APIs.

Appointment requests are not confirmed until clinic staff follow up. Update the sample clinic phone, email, address, images, and clinic details in `client/src/App.jsx` before launch.
