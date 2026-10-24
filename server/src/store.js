import { MongoClient } from 'mongodb';

let client;
let db;
const memory = {
  tickets: [],
  orders: [],
  knowledge: [],
  users: [],
  sessions: [],
};

export async function connectStore() {
  if (!process.env.MONGODB_URI) {
    console.log('MongoDB URI not set; starting with empty in-memory storage.');
    return 'memory';
  }
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'smartdesk');
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ googleSub: 1 }, { unique: true, sparse: true }),
    db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true, sparse: true }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('tickets').createIndex({ ownerId: 1, id: 1 }, { unique: true }),
    db.collection('tickets').createIndex({ ownerId: 1, customerId: 1, createdAt: -1 }),
    db.collection('orders').createIndex({ ownerId: 1, orderNumber: 1 }, { unique: true }),
    db.collection('knowledge').createIndex({ ownerId: 1, id: 1 }, { unique: true }),
  ]);
  console.log(`Connected to MongoDB database "${db.databaseName}".`);
  return 'mongodb';
}

export const storageMode = () => (db ? 'mongodb' : 'memory');

export async function list(name, filter = {}) {
  if (!db)
    return memory[name]
      .filter((item) => Object.entries(filter).every(([key, value]) => item[key] === value))
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.placedAt || b.updatedAt || 0) -
          new Date(a.createdAt || a.placedAt || a.updatedAt || 0),
      );
  return db
    .collection(name)
    .find(filter)
    .sort({ createdAt: -1, placedAt: -1, updatedAt: -1 })
    .toArray();
}

export async function findOne(name, filter) {
  if (!db)
    return (
      memory[name].find((item) =>
        Object.entries(filter).every(([key, value]) => item[key] === value),
      ) || null
    );
  return db.collection(name).findOne(filter);
}

export async function insert(name, document) {
  if (!db) {
    memory[name].unshift(document);
    return document;
  }
  await db.collection(name).insertOne(document);
  return document;
}

export async function update(name, filter, changes) {
  if (!db) {
    const item = memory[name].find((entry) =>
      Object.entries(filter).every(([key, value]) => entry[key] === value),
    );
    if (!item) return null;
    Object.assign(item, changes);
    return item;
  }
  const result = await db
    .collection(name)
    .findOneAndUpdate(filter, { $set: changes }, { returnDocument: 'after' });
  return result;
}

export async function remove(name, filter) {
  if (!db) {
    const index = memory[name].findIndex((entry) =>
      Object.entries(filter).every(([key, value]) => entry[key] === value),
    );
    if (index < 0) return false;
    memory[name].splice(index, 1);
    return true;
  }
  const result = await db.collection(name).deleteOne(filter);
  return result.deletedCount > 0;
}

export async function closeStore() {
  if (client) await client.close();
}
