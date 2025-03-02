const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Gender: { type: String, required: true },
  Category: { type: String, required: true },
  Price: { type: String, required: true },
  Brand: { type: String, required: true },
  Size: { type: [String], required: true },
  Color: { type: String, required: true },
  Desc: { type: String, required: true },
  Image: { type: String, required: true },
});

module.exports = mongoose.model("Product", ProductSchema, "product");
