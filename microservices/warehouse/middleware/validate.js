const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    console.log(req.body);
    const { error } = Joi.object(schema).validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ errors });
    }
    next();
  };
};

module.exports = validate;