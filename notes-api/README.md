# Notes API

A REST API for a notes app. Users register and log in to get a JWT, then create, read, update, and delete their own private notes.

**Stack:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, express-validator

## Quick start

**Requirements:** Node.js 18+ and MongoDB (a local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
# edit .env: set MONGO_URI and a strong JWT_SECRET
npm run dev               # or: npm start
```

The server runs at http://localhost:5000.

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign tokens (use a long random string) |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d`, `2h` (default `1d`) |

## API

Notes routes need the header `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account, returns `{ token, user }` |
| POST | `/api/auth/login` | No | Log in, returns `{ token, user }` |
| POST | `/api/notes` | Yes | Create a note (`title` required, `content` optional) |
| GET | `/api/notes` | Yes | List your notes: `?page=1&limit=10&q=keyword` |
| GET | `/api/notes/:id` | Yes | Get one note |
| PUT | `/api/notes/:id` | Yes | Update `title` and/or `content` |
| DELETE | `/api/notes/:id` | Yes | Delete a note |

### Example requests

```bash
# Register (response contains your token)
curl -X POST localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com","password":"secret123"}'

# Create a note
curl -X POST localhost:5000/api/notes -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" -d '{"title":"Groceries","content":"Milk, eggs"}'

# Search your notes for "milk"
curl "localhost:5000/api/notes?q=milk&page=1&limit=10" -H "Authorization: Bearer $TOKEN"
```

Or import `postman/notes-api.postman_collection.json` into Postman. Run **Register** or **Login** first; the token and note id are saved automatically.

### Responses

Errors always look like `{ "message": "..." }`; validation errors add an `errors` array of `{ field, message }`.

| Code | Meaning |
|---|---|
| 200 / 201 | Success / created |
| 400 | Validation failed, invalid id, or malformed JSON |
| 401 | Missing, invalid, or expired token; wrong email or password |
| 404 | Note not found (also returned for other users' notes, so ids can't be probed) |
| 409 | Email already registered |
| 429 | Too many register/login attempts (30 per 15 minutes per IP) |
| 500 | Server error |

## Project structure

```
notes-api/
├── server.js                 # entry point: loads env, connects DB, starts server
├── src/
│   ├── app.js                # Express app: middleware + routes
│   ├── config/db.js          # MongoDB connection
│   ├── models/               # User, Note (Mongoose schemas)
│   ├── controllers/          # auth + notes logic
│   ├── routes/               # route definitions + validation rules
│   ├── middleware/           # auth (JWT), validate, errorHandler
│   └── utils/asyncHandler.js # forwards async errors to the error handler
└── postman/                  # ready-to-import Postman collection
```

## Security notes

- Passwords are hashed with bcrypt (10 salt rounds) and never returned (`select: false`).
- JWTs (HS256) are verified on every notes request; tokens for deleted users are rejected.
- Every note query includes the logged-in user's id.
- Inputs are validated and whitelisted (no mass assignment); search text is regex-escaped.
- `helmet`, a 100 KB body limit, and rate limiting on register/login.

## Deploying

Use Render or Railway with MongoDB Atlas. Set the same environment variables plus `NODE_ENV=production`.
