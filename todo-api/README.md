# To-Do List API

A REST API for managing tasks: add, list, update, and delete. Built with Node.js, Express, and MongoDB (Mongoose), and tested with Postman.

## Quick start

**Requirements:** Node.js 18+ and MongoDB (a local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
npm install
npm run dev      # restarts on changes; use `npm start` for plain node
```

The included `.env` points at a local MongoDB. Using Atlas? Replace `MONGO_URI` in `.env` with your connection string. The API runs at http://localhost:5000.

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `MONGO_URI` | MongoDB connection string (default `mongodb://127.0.0.1:27017/todo_api`) |

## Task model

| Field | Type | Rules |
|---|---|---|
| `title` | String | required, trimmed, max 100 characters |
| `description` | String | optional, max 500 characters |
| `completed` | Boolean | default `false` |
| `priority` | String | optional: `low`, `medium`, or `high` |
| `dueDate` | Date | optional, ISO 8601 (e.g. `2026-12-31`) |
| `createdAt`, `updatedAt` | Date | set automatically |

## API

| Method | Route | Description | Success | Errors |
|---|---|---|---|---|
| POST | `/api/tasks` | Add a task | 201 | 400 |
| GET | `/api/tasks` | List tasks, newest first (`?completed=true` or `false` to filter) | 200 | none |
| GET | `/api/tasks/:id` | Get one task | 200 | 400, 404 |
| PUT | `/api/tasks/:id` | Update a task (send only the fields to change) | 200 | 400, 404 |
| DELETE | `/api/tasks/:id` | Delete a task | 200 | 400, 404 |

**400** means validation failed, the id is malformed, or the JSON is malformed. **404** means the task wasn't found. Errors look like `{ "message": "..." }`; validation errors also include an `errors` array of `{ field, message }`.

### Example requests

```bash
# Add a task
curl -X POST localhost:5000/api/tasks -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","priority":"high","dueDate":"2026-12-31"}'

# List unfinished tasks
curl "localhost:5000/api/tasks?completed=false"

# Update (replace <id> with a task's _id)
curl -X PUT localhost:5000/api/tasks/<id> -H "Content-Type: application/json" -d '{"completed":true}'

# Delete
curl -X DELETE localhost:5000/api/tasks/<id>
```

## Testing with Postman

1. Start the API (`npm run dev`).
2. In Postman, **Import** `postman/todo-api.postman_collection.json`.
3. Open the collection, click **Run** to open the Collection Runner, then **Run To-Do API**.

The collection has 10 requests that run in order: create (valid and invalid), get all, get one (valid, malformed id, unknown id), update (valid and invalid), then delete and delete again. Every request has `pm.test` checks, and the created task's id is saved to the `taskId` variable automatically. Screenshot the passing results for your submission.

## Project structure

```
todo-api/
├── server.js                  # entry point: loads env, connects DB, starts server
├── src/
│   ├── app.js                 # Express app: middleware + routes
│   ├── config/db.js           # MongoDB connection
│   ├── models/Task.js         # Task schema
│   ├── controllers/           # task logic (create, list, get, update, delete)
│   ├── routes/taskRoutes.js   # routes + validation rules
│   ├── middleware/            # validate, errorHandler
│   └── utils/asyncHandler.js  # forwards async errors to the error handler
└── postman/                   # importable Postman collection with tests
```

## Notes

- Only `title`, `description`, `completed`, `priority`, and `dueDate` can be set from a request body; anything else is ignored.
- Ids are validated before the database is queried, so a bad id returns 400, not 500.
