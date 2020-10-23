const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad-request-err');

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((users) => res.status(200).send(users))
    .catch(next);
};

module.exports.getUser = (req, res, next) => {
  User.findById(req.params.userId)
    .orFail(new NotFoundError('Нет пользователя с таким id'))
    .then((user) => res.send({ data: user }))
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  if (!req.body.password || req.body.password.length < 8) {
    throw new BadRequestError('Пароль должен быть не менее 8 символов');
  } else {
    bcrypt.hash(req.body.password, 10)
      .then((hash) => User.create({
        name: req.body.name,
        about: req.body.about,
        avatar: req.body.avatar,
        email: req.body.email,
        password: hash,
      }))
      .then((user) => res.status(201).send({
        _id: user._id,
        name: user.name,
        about: user.about,
        avatar: user.avatar,
        email: user.email,
      }))
      .catch(next);
  }
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  const { NODE_ENV, JWT_SECRET } = process.env;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret',
        { expiresIn: '7d' });
      res
        .cookie('jwt', token, {
          maxAge: 86400 * 7,
          httpOnly: true,
          sameSite: true,
        });
      res.send({ message: 'Авторизация прошла успешна. Токен записан в куки' });
    })
    .catch(next);
};

module.exports.changeUserInfo = (req, res, next) => {
  const { name, about } = req.body;

  User.findByIdAndUpdate(req.user._id, { name, about }, { runValidators: true, new: true })
    .orFail(new NotFoundError('Нет пользователя с таким id'))
    .then((user) => res.send({ data: user }))
    .catch(next);
};

module.exports.changeUserAvatar = (req, res, next) => {
  const { avatar } = req.body;

  User.findByIdAndUpdate(req.user._id, { avatar }, { runValidators: true, new: true })
    .orFail(new NotFoundError('Нет пользователя с таким id'))
    .then((user) => res.send({ data: user }))
    .catch(next);
};
