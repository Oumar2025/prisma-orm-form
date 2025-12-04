const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
// Add datasourceUrl for Prisma v7
const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db'
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// API Routes

// GET all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET single user
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// POST new user
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, age } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                age: age ? parseInt(age) : null
            }
        });

        res.json({
            ...user,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error('Error creating user:', error);

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }

        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT update user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, age } = req.body;

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                name,
                email,
                age: age ? parseInt(age) : null
            }
        });

        res.json({
            ...user,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Error updating user:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }

        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }

        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Prisma server running at http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('Prisma connection closed.');
    process.exit(0);
});