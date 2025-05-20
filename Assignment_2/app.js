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

app.set('view engine', 'ejs');

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
  password: String,
  user_type: { type: String, default: 'user' }
});
const User = mongoose.model('User', userSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function sessionValidation(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

function adminAuthorization(req, res, next) {
  console.log("Admin Auth Check:", req.session.user);

  if (req.session.user?.user_type === 'admin') {
    next();
  } else {
    res.status(403);
    res.render('errorMessage', { error: "Not Authorized" });
  }
}

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
  res.render("index", { user: req.session.user });
  });

  app.get('/signup', (req, res) => {
    res.render('signup');
  });

  app.get('/login', (req, res) => {
    res.render('login');
  });

  app.get('/debug', (req, res) => {
    res.json(req.session.user);
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

  req.session.user = {
    name: newUser.name,
    email: newUser.email,
    user_type: newUser.user_type 
  };
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

  const user = await User.findOne({ email }).select('name email password user_type');
  console.log("MongoDB User:", user);
  if (!user) {
    return res.send(`<p>User not found. <a href="/login">Try again</a></p>`);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.send(`<p>Invalid password. <a href="/login">Try again</a></p>`);
  }

  if (await bcrypt.compare(password, user.password)) {
    req.session.user = {
      name: user.name,
      email: user.email,
      user_type: user.user_type // ✅ ADD THIS LINE
    };
  
    console.log("SESSION SET:", req.session.user); // Optional
    return res.redirect('/welcome');
  }
});

app.get('/welcome', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  res.render("welcome", { user: req.session.user });
});

app.get('/members', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  const name = req.session.user.name;
  const images = ['cat1.jpg', 'cat2.jpg', 'cat3.jpg'];

  res.render("members", { name, images });
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error logging out');
    }
    res.redirect('/');
  });
});

app.get('/admin', sessionValidation, adminAuthorization, async (req, res) => {
  const users = await User.find({}, 'name email user_type');
  res.render("admin", { users });
});

app.post('/promote/:email', sessionValidation, adminAuthorization, async (req, res) => {
  await User.updateOne({ email: req.params.email }, { $set: { user_type: 'admin' } });
  res.redirect('/admin');
});

app.post('/demote/:email', sessionValidation, adminAuthorization, async (req, res) => {
  await User.updateOne({ email: req.params.email }, { $set: { user_type: 'user' } });
  res.redirect('/admin');
});

app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});