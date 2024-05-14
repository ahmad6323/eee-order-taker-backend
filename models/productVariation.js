const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productVariationSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    color: {
        type: Schema.Types.ObjectId,
        ref: 'Color', 
        required: true
    },
    size: {
        type: Schema.Types.ObjectId,
        ref: 'Size', 
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
