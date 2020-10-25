const validator = require('validator');
const BadRequestError = require('../errors/bad-request-err');

const validatorURL = (link) => {
  if (!validator.isURL(link)) {
    throw new BadRequestError('Здесь должна быть ссылка');
  }

  return link;
};

const validatorEmail = (mail) => {
  if (!validator.isEmail(mail)) {
    throw new BadRequestError('Неправильный формат почты');
  }

  return mail;
};

module.exports = {
  validatorURL,
  validatorEmail,
};
