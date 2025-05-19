const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 8000;

// Middleware to parse form and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (CSS, JS, images)
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/img", express.static(path.join(__dirname, "public/img")));

// Session middleware
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true
}));

// ------------------------
// Session-based counter API
// ------------------------
app.get('/api/counter', (req, res) => {
    if (typeof req.session.counter === 'undefined') {
        req.session.counter = 0;
    }
    res.json({ counter: req.session.counter });
});

app.post('/api/counter/up', (req, res) => {
    req.session.counter++;
    res.json({ counter: req.session.counter });
});

app.post('/api/counter/down', (req, res) => {
    req.session.counter--;
    res.json({ counter: req.session.counter });
});

// Serve the settings page
app.get("/settings", (req, res) => {
    res.sendFile(path.join(__dirname, 'app/html/settings.html'));
});

// Handle style changes and save in session
app.get("/changeStyle", (req, res) => {
    const { color, bg } = req.query;
    if (color && bg) {
        req.session.styles = { color: color, bg: bg };
    }
    res.redirect("/");
});

// ------------------------
// Serve index.html
// ------------------------
app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "app/html/index.html");
    let html = fs.readFileSync(filePath, "utf8");

    // Default colors if none set
    const color = req.session.styles?.color || "black";
    const bg = req.session.styles?.bg || "white";

    // Replace placeholders (you'll add placeholders in HTML too)
    html = html.replace("{{color}}", color).replace("{{bg}}", bg);

    res.send(html);
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});