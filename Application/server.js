const express = require('express');
const cors = require('cors'); // 1. Require the cors package
const { MongoClient } = require('mongodb');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// 2. Enable CORS for your Vercel frontend domain
app.use(cors({
    origin: ['https://neev-academy-bpjgnyybm-rishabh57mishra-gmailcoms-projects.vercel.app', 'https://neev-academy.vercel.app'], 
    credentials: true
}));

app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
const uri = process.env.MONGO_URI; 
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('neev_academy_db'); // Name your database
        console.log("Connected to MongoDB successfully!");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
connectDB();

// API Endpoint to get all students
app.get('/api/students', async (req, res) => {
    try {
        const students = await db.collection('students').find({}).toArray();
        res.status(200).json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Endpoint to add a student
app.post('/api/students', async (req, res) => {
    try {
        const newStudent = req.body;
        const result = await db.collection('students').insertOne(newStudent);
        res.status(201).json({ message: "Student added", id: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fallback to route everything else to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
