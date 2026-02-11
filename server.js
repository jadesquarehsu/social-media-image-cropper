const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || '';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Password verification endpoint
app.post('/api/verify', (req, res) => {
    const { password } = req.body;

    if (!ACCESS_PASSWORD) {
        // No password set → allow access
        return res.json({ ok: true });
    }

    if (password === ACCESS_PASSWORD) {
        return res.json({ ok: true });
    }

    return res.status(401).json({ ok: false, message: '密碼錯誤' });
});

// Check if password is required
app.get('/api/auth-required', (req, res) => {
    res.json({ required: !!ACCESS_PASSWORD });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (ACCESS_PASSWORD) {
        console.log('Password protection: ENABLED');
    } else {
        console.log('Password protection: DISABLED (set ACCESS_PASSWORD env var to enable)');
    }
});
