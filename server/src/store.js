import { MongoClient } from 'mongodb';
import { seedKnowledge, seedOrders, seedTickets } from './data.js';

let client;
let db;
let memory = {
  tickets: structuredClone(seedTickets),
  orders: structuredClone(seedOrders),
  knowledge: structuredClone(seedKnowledge),
};

export async function connectStore() {
  if (!process.env.MONGODB_URI) {
    console.log('MongoDB URI not set; starting with sample data in demo mode.');
    return 'demo';
  }
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'smartdesk');
  const collections = ['tickets', 'orders', 'knowledge'];
  for (const name of collections) {
    const collection = db.collection(name);
    if ((await collection.countDocuments()) === 0) {
      const seed =
        name === 'tickets' ? seedTickets : name === 'orders' ? seedOrders : seedKnowledge;
      await collection.insertMany(seed);
    }
  }
  console.log(`Connected to MongoDB database "${db.databaseName}".`);
  return 'mongodb';
}

export const storageMode = () => (db ? 'mongodb' : 'demo');

export async function list(name, filter = {}) {
  if (!db)
    return memory[name]
      .filter((item) =>
        Object.entries(filter).every(([key, value]) => !value || item[key] === value),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0),
      );
  return db.collection(name).find(filter).sort({ createdAt: -1, updatedAt: -1 }).toArray();
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

export async function closeStore() {
  if (client) await client.close();
}
