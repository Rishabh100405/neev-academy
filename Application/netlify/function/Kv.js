// netlify/functions/kv.js
// One generic key-value endpoint backed by MongoDB Atlas.
// Mirrors the app's existing sget/sset/sdel pattern (same shape as the
// Firestore calls it replaces), so the rest of the app doesn't need to change.

const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI; // set this in Netlify dashboard, NEVER in code
const dbName = "neevacademy";
const collectionName = "kv";

let cachedClient = null;
async function getCollection() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  return cachedClient.db(dbName).collection(collectionName);
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const key = event.queryStringParameters && event.queryStringParameters.key;
  if (!key) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing ?key=" }) };
  }

  try {
    const col = await getCollection();

    if (event.httpMethod === "GET") {
      const doc = await col.findOne({ _id: key });
      if (!doc) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "not found" }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ v: doc.v }) };
    }

    if (event.httpMethod === "PUT") {
      const body = JSON.parse(event.body || "{}");
      await col.updateOne(
        { _id: key },
        { $set: { v: body.v, updatedAt: new Date() } },
        { upsert: true }
      );
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === "DELETE") {
      await col.deleteOne({ _id: key });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
