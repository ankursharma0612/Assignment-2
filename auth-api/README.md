# Auth API (Assignment 2)

A REST API where users register and log in. Passwords are stored as **bcrypt hashes** (hashing, not encryption: it is one-way and salted, so a password cannot be recovered from the database). Access is controlled with **JWTs**, and a protected `GET /api/auth/me` route proves the token works.

**Stack:** Node.js, Express, MongoDB (Mongoose), bcryptjs, jsonwebtoken, express-validator, helmet, cors, morgan, express-rate-limit.

## Setup

```bash
npm install
cp .env.example .env     # then edit .env
npm run dev              # or: npm start
```

`.env` values:

| Variable | Meaning |
|---|---|
| `PORT` | Port to listen on (default 5000) |
| `MONGO_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Long random string. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d` (use `10s` to demo expiry) |
| `RATE_LIMIT_MAX` | Max register/login requests per IP per 15 min (default 50) |

## Endpoints

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | 201 | 400, 409, 429 |
| POST | `/api/auth/login` | No | 200 | 400, 401, 429 |
| GET | `/api/auth/me` | `Authorization: Bearer <token>` | 200 | 401 |

**Register** `{ "name": "Asha", "email": "asha@example.com", "password": "password123" }`
**Login** `{ "email": "asha@example.com", "password": "password123" }`
Both return `{ "token": "<jwt>", "user": { "id", "name", "email" } }`.

Validation rules: `name` required (max 50), `email` valid format (stored lowercase, unique), `password` 8 to 72 characters (bcrypt only uses the first 72 bytes). Email and password must be strings, which blocks NoSQL operator injection.

Error codes: **400** validation failed, **401** wrong credentials or missing/invalid/expired token, **409** email already registered, **429** too many attempts.

## How it works

1. **Register:** validate, reject duplicate email, hash the password (10 salt rounds) in a Mongoose `pre('save')` hook, save, sign a JWT containing the user id.
2. **Login:** find user by email (explicitly selecting the hidden password field), `bcrypt.compare`. Unknown email and wrong password return the same 401 message, and a dummy hash comparison keeps response times similar.
3. **Protected routes:** the `auth` middleware verifies the signature and expiry (HS256 only), loads the user, and sets `req.user`.

## Testing

**Automated tests (15 tests, in-memory MongoDB, nothing to set up):**
```bash
npm test
```
The first run downloads a MongoDB binary, so it needs internet. To use your own database instead:
`TEST_MONGO_URI=mongodb://127.0.0.1:27017/auth-test npm test`

**Postman:** import `postman/auth-api.postman_collection.json`, start the server, and run the collection with the Collection Runner (9 requests, 16 assertions, re-runnable because the register email is regenerated each run). Or from the terminal: `npm run postman`.

**Extra screenshots for the submission**
1. Hashed password: open the `users` collection in Compass/Atlas. The password starts with `$2b$`.
2. Expired token: set `JWT_EXPIRES_IN=10s`, restart, log in, wait 10 seconds, then call `/me`. You get 401 `Token expired`.

## Security checklist
- Passwords hashed with bcrypt, never stored or logged in plain text
- `JWT_SECRET` in git-ignored `.env`, tokens expire
- Password hidden (`select: false`) and removed from all JSON output
- String-type validation blocks NoSQL injection
- Rate limiting on register/login, `helmet` headers, 10 kb body limit
- Generic login error message (no user enumeration)

## Structure
```
auth-api/
├── src/
│   ├── config/db.js
│   ├── models/User.js
│   ├── controllers/authController.js
│   ├── routes/authRoutes.js
│   ├── middleware/{auth,validate,errorHandler}.js
│   ├── utils/{asyncHandler,token}.js
│   └── app.js
├── tests/auth.test.js
├── postman/auth-api.postman_collection.json
├── server.js
└── .env.example
```
