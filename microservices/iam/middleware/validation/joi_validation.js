const Joi = require("joi");

/**
 * Middleware to validate login request body using Joi
 */
module.exports.validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    next();
};


/**
 * Middleware to validate logout request body
 */
module.exports.validateLogout = (req, res, next) => {
    console.log(req.body)
    const schema = Joi.object({
        refreshToken: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    next();
};

/**
 * Middleware to validate registration request body using Joi
 */
module.exports.validateRegistration = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required()
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
            .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        address: Joi.object({
            street: Joi.string().min(5).max(100).required(),
            city: Joi.string().min(2).max(50).required(),
            state: Joi.string().min(2).max(50).required(),
            zipCode: Joi.string().pattern(/^[0-9]{5}(-[0-9]{4})?$/).required(),
            country: Joi.string().min(2).max(50).required(),
        }).optional()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    next();
};