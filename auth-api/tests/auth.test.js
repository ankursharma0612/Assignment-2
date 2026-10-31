// Run with: npm test   (uses Node's built-in test runner)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.RATE_LIMIT_MAX = '1000';

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');

let mongod;
let token;
const creds = { name: 'Asha', email: 'asha@example.com', password: 'password123' };

before(async () => {
  let uri = process.env.TEST_MONGO_URI; // optional: point at your own MongoDB
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await mongoose.connect(uri);
  await User.deleteMany({});
  await User.init(); // make sure the unique email index exists
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const noPassword = (body) => assert.doesNotMatch(JSON.stringify(body), /password/i);

describe('POST /api/auth/register', () => {
  test('201: creates a user, returns token + user, no password', async () => {
    const res = await request(app).post('/api/auth/register').send(creds);
    assert.equal(res.status, 201);
    assert.equal(typeof res.body.token, 'string');
    assert.deepEqual(Object.keys(res.body.user).sort(), ['email', 'id', 'name']);
    assert.equal(res.body.user.email, creds.email);
    noPassword(res.body);
  });

  test('password is stored as a bcrypt hash, not plain text', async () => {
    const user = await User.findOne({ email: creds.email }).select('+password');
    assert.notEqual(user.password, creds.password);
    assert.match(user.password, /^\$2[aby]\$10\$/);
  });

  test('409: duplicate email (case-insensitive)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...creds, email: 'ASHA@example.com' });
    assert.equal(res.status, 409);
  });

  test('400: bad email and short password are both reported', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'nope', password: 'short' });
    assert.equal(res.status, 400);
    const fields = res.body.errors.map((e) => e.field);
    assert.ok(fields.includes('email') && fields.includes('password'));
  });

  test('400: password longer than 72 bytes', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...creds, email: 'long@example.com', password: 'a'.repeat(73) });
    assert.equal(res.status, 400);
  });

  test('400: NoSQL operator injection in email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...creds, email: { $gt: '' } });
    assert.equal(res.status, 400);
  });

  test('400: malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    assert.equal(res.status, 400);
  });
});

describe('POST /api/auth/login', () => {
  test('200: correct credentials return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: creds.password });
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.token, 'string');
    noPassword(res.body);
    token = res.body.token;
  });

  test('401: wrong password and unknown email give the same message', async () => {
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'wrong-password' });
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'whatever123' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.message, unknown.body.message);
  });

  test('400: NoSQL operator injection', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: { $gt: '' } });
    assert.equal(res.status, 400);
  });
});

describe('GET /api/auth/me', () => {
  const me = (header) => {
    const r = request(app).get('/api/auth/me');
    return header ? r.set('Authorization', header) : r;
  };

  test('200: valid token returns the profile, no password', async () => {
    const res = await me(`Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, creds.email);
    noPassword(res.body);
  });

  test('401: no token', async () => {
    assert.equal((await me()).status, 401);
  });

  test('401: garbage token "abc"', async () => {
    const res = await me('Bearer abc');
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Invalid token');
  });

  test('401 "Token expired": expired token', async () => {
    const user = await User.findOne({ email: creds.email });
    const expired = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await me(`Bearer ${expired}`);
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Token expired');
  });

  test('401: token signed with the wrong secret', async () => {
    const user = await User.findOne({ email: creds.email });
    const forged = jwt.sign({ id: user._id }, 'some-other-secret');
    assert.equal((await me(`Bearer ${forged}`)).status, 401);
  });
});
