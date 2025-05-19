const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3018;

// Set view engine to EJS and define views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app', 'views'));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Home page
app.get('/', (req, res) => {
  res.render('index', {
    css: ['css/style.css'],
    js: ['js/script.js']
  });
});

// Color index pages
app.get('/:color(red|green|blue)', (req, res) => {
    const color = req.params.color;
    res.render('color', {
      color,
      css: [
        'css/nav.css',
        'css/common.css',
        'css/footer.css',
        `css/${color}.css`,
        `css/${color}-index.css`
      ],
      js: ['js/script.js']
    });
  });

// Color size pages
app.get('/:color(red|green|blue)/:size(20|30|40)', (req, res) => {
    const { color, size } = req.params;
    res.render('color-size', {
      color,
      size,
      css: [
        'css/nav.css',
        'css/common.css',
        'css/footer.css',
        `css/${color}.css`,
        `css/font${size}.css`,
        'css/button.css'
      ],
      js: [`js/${color}.js`]
    });
  });

// 404 fallback
app.use((req, res) => {
  res.status(404).send('<h1>404 - Page Not Found</h1>');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});