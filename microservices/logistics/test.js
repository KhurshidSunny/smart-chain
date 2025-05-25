const test = {
    _id: ObjectId,
    orderId: ObjectId,
    orderNumber: String,
    status: String, // Enum: "Pending", "InProgress", "Completed", "Cancelled"
    items: [{
        productId: ObjectId,
        sku: String,
        name: String,
        quantity: Number,
        picked: Number,
        location: String
    }],
    assignedTo: ObjectId,
    startedAt: Date,
    completedAt: Date,
    createdAt: Date,
    updatedAt: Date
}

const test2 = {
    _id: ObjectId,
    orderId: ObjectId,
    orderNumber: String,
    status: String, // Enum: "Pending", "InProgress", "Completed", "Cancelled"
    items: [{
        productId: ObjectId,
        sku: String,
        name: String,
        quantity: Number,
        picked: Number,
        location: String
    }],
    assignedTo: ObjectId,
    startedAt: Date,
    completedAt: Date,
    createdAt: Date,
    updatedAt: Date
}