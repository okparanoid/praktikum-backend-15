require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { celebrate, Joi, errors } = require('celebrate');
const cards = require('./routes/cards.js');
const users = require('./routes/users.js');
const { createUser, login } = require('./controllers/users.js');
const auth = require('./middlewares/auth.js');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const { validatorURL, validatorEmail } = require('./middlewares/validator');

const { PORT = 3000 } = process.env;

const app = express();

mongoose.connect('mongodb://localhost:27017/mestodb', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(requestLogger);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().custom(validatorEmail),
    password: Joi.string().required().min(8),
  }),
}), login);

app.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30),
    about: Joi.string().required().min(2).max(30),
    avatar: Joi.string().required().custom(validatorURL),
    email: Joi.string().required().custom(validatorEmail),
    password: Joi.string().required().min(8),
  }),
}), createUser);

app.use(auth);

app.use('/cards', cards);
app.use('/users', users);

app.use(errorLogger);
app.use(errors());

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;

  if (err.name === 'ValidationError') {
    return res.status(400).send({ message: err.message });
  } if (err.code === 11000) {
    return res.status(409).send({ message: 'Введите другую почту' });
  } if (err.name === 'CastError') {
    return res.status(400).send({ message: 'Невалидный id' });
  }

  return res.status(statusCode).send({ message: statusCode === 500 ? 'На сервере произошла ошибка' : message });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен, порт: ${PORT}.`);
});
