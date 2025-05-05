require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`,
    crypto: {
      secret: process.env.MONGODB_SESSION_SECRET
    }
  }),
  cookie: { maxAge: 1000 * 60 * 60 }
}));

app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.send(`
      <h1>Home</h1>
      <p><a href="/signup">Sign Up</a> | <a href="/login">Login</a></p>
    `);
  }

  res.send(`
    <h1>Welcome, ${req.session.user.name}</h1>
    <p><a href="/members">Members Area</a> | <a href="/logout">Logout</a></p>
  `);
});

app.get('/signup', (req, res) => {
  res.send(`
    <h1>Sign Up</h1>
    <form method="POST" action="/signup">
      Name: <input name="name" /><br/>
      Email: <input name="email" /><br/>
      Password: <input type="password" name="password" /><br/>
      <button type="submit">Sign Up</button>
    </form>
    <p><a href="/">Back to Home</a></p>
  `);
});

app.get('/login', (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="POST" action="/login">
      Email: <input name="email" /><br/>
      Password: <input type="password" name="password" /><br/>
      <button type="submit">Log In</button>
    </form>
    <p><a href="/">Back to Home</a></p>
  `);
});

app.post('/signup', async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(30).required()
  });

  const validationResult = schema.validate(req.body);
  if (validationResult.error) {
    return res.send(`<h1>Signup Error</h1><p>${validationResult.error.details[0].message}</p><a href="/signup">Try again</a>`);
  }

  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.send(`<p>Email already registered. <a href="/signup">Try again</a></p>`);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();

  req.session.user = { name, email };
  res.redirect('/welcome');
});

app.post('/login', async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(30).required()
  });

  const validationResult = schema.validate(req.body);
  if (validationResult.error) {
    return res.send(`<h1>Login Error</h1><p>${validationResult.error.details[0].message}</p><a href="/login">Try again</a>`);
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.send(`<p>User not found. <a href="/login">Try again</a></p>`);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.send(`<p>Invalid password. <a href="/login">Try again</a></p>`);
  }

  req.session.user = { name: user.name, email: user.email };
  res.redirect('/welcome');
});

app.get('/welcome', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  res.send(`
    <h1>Welcome, ${req.session.user.name}</h1>
    <p>You have successfully logged in.</p>
    <form action="/members" method="GET">
      <button type="submit">Go to Members Area</button>
    </form>
    <p><a href="/logout">Logout</a></p>
  `);
});

app.get('/members', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  const name = req.session.user.name;
  const images = ['cat1.jpg', 'cat2.jpg', 'cat3.jpg'];
  const randomImage = images[Math.floor(Math.random() * images.length)];

  res.send(`
    <h1>Members Area</h1>
    <p>Hello, ${name}</p>
    <img src="/${randomImage}" alt="Random" style="max-width: 300px;" />
    <p><a href="/logout">Logout</a></p>
  `);
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error logging out');
    }
    res.redirect('/');
  });
});

app.use((req, res) => {
  res.status(404).send('<h1>404 - Page Not Found</h1>');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});