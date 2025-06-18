const Joi = require('joi');

// Validation schemas
const schemas = {
  createPackage: Joi.object({
    orderId: Joi.string().required(),
    packagingType: Joi.string().required(),
    dimensions: Joi.object({
      width: Joi.number().min(0).required(),
      height: Joi.number().min(0).required(),
      depth: Joi.number().min(0).required(),
      weight: Joi.number().min(0).required()
    }).required(),
    packedBy: Joi.string().required(),
    shippingAddress: Joi.object({
      addressId: Joi.string().optional(), // Optional IAM Address reference
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().required()
    }).required()
  }),

  updatePackage: Joi.object({
    packagingType: Joi.string().optional(),
    dimensions: Joi.object({
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional(),
      depth: Joi.number().min(0).optional(),
      weight: Joi.number().min(0).optional()
    }).optional()
  }),

  createPickingList: Joi.object({
    orderId: Joi.string().required(),
    orderNumber: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        sku: Joi.string().required(),
        name: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        location: Joi.string().required()
      })
    ).required()
  }),

  updatePickingListStatus: Joi.object({
    status: Joi.string()
      .valid('Pending', 'InProgress', 'Completed', 'Cancelled')
      .insensitive()
      .required()
  }),

  assignPickingList: Joi.object({
    assignedTo: Joi.string().required()
  }),

  updatePickedQuantity: Joi.object({
    picked: Joi.number().min(0).required()
  })
};

// Middleware to validate request body against a specific schema
const validate = (schemaName) => {
  return (req, res, next) => {
    console.log(req.body)
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ message: 'Validation schema not found' });
    }
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      console.log(error.message)
      return res.status(400).json({ errors });
    }
    next();
  };
};

module.exports = { validate, schemas };