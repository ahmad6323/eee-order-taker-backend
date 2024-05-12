const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productVariationSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product', // Reference to the main product
        required: true
    },
    color: {
        type: Schema.Types.ObjectId,
        ref: 'Color', // Reference to the color
        required: true
    },
    size: {
        type: Schema.Types.ObjectId,
        ref: 'Size', // Reference to the size
        required: true
    },
    SKU: {
        type: String,
        required: true,
        unique: true
    }
});

const ProductVariation = mongoose.model('ProductVariation', productVariationSchema);

module.exports = ProductVariation;
