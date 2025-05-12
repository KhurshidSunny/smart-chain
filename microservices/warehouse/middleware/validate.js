const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const joiSchema = Joi.object().keys(schema);
    const { error } = joiSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ errors });
    }
    next();
  };
};

module.exports = validate;