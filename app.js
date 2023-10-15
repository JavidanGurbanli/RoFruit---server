const products = require("./data")
const express = require("express");
const Joi = require("joi");
const app = express();
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

//! ---------------------------- GET ALL PRODUCTS ---------------------------- */

app.get("/api/v1/products", (req, res) => {
  res.send(products);
});

//! ----------------------------- CREATE PRODUCT ----------------------------- */

app.post("/api/v1/products", upload.single("image_url"), (req, res) => {
  const { error } = validateProduct({
    ...req.body,
    image_url: req.file?.path,
  });

  if (error) return res.status(400).send(error);

  const product = {
    id: uuidv4(),
    name: req.body.name,
    retail_price: req.body.retail_price,
    wholesale_price: req.body.wholesale_price,
    discount: req.body.discount ?? 0,
    image_url: `http://localhost:5000/${req.file.path}`,
    date: req.body.date,
    category: req.body.category,
  };
  products.push(product);
  res.send(products);
});

//! ------------------------------ EDIT PRODUCT ------------------------------ */

app.put("/api/v1/products/:id", upload.single("image_url"), (req, res) => {
  const product = products.find((product) => product.id == req.params.id);
  if (!product) {
    return res.status(404).send("Mehsul tapilmadi");
  }

  const { error } = validateUpdateProduct({
    ...req.body,
    image_url: req.file?.path,
  });

  if (error) return res.status(400).send(error);

  product.name = req.body.name;
  product.retail_price = req.body.retail_price;
  product.wholesale_price = req.body.wholesale_price;
  product.discount = req.body.discount;
  product.date = req.body.date;
  product.category = req.body.category;
  if (req.file) {
    product.image_url = `http://localhost:5000/${req.file.path}`;
  }

  res.send(products);
});

//! ----------------------------- DELETE PRODUCT ----------------------------- */

app.delete("/api/v1/products/:id", (req, res) => {
  const product = products.find((product) => product.id == req.params.id);
  if (!product) {
    return res.status(404).send("Silmek ucun mehsul tapilmadi");
  }
  const index = products.indexOf(product);
  products.splice(index, 1);

  res.send(products);
});

// Validate new product
function validateProduct(product) {
  const schema = Joi.object({
    name: Joi.string().required(),
    retail_price: Joi.number().required(),
    wholesale_price: Joi.number().required(),
    discount: Joi.number().required(),
    image_url: Joi.string().required(),
    date: Joi.string().required(),
    category: Joi.string().required(),
  });

  return schema.validate(product);
}

// Validate updated product
function validateUpdateProduct(product) {
  const schema = Joi.object({
    name: Joi.string().required(),
    retail_price: Joi.number().required(),
    wholesale_price: Joi.number().required(),
    discount: Joi.number().required(),
    image_url: Joi.string().when("file", {
      is: Joi.exist(),
      then: Joi.required(),
    }),
    date: Joi.string().required(),
    category: Joi.string().required(),
  });

  return schema.validate(product);
}

//! ---------------------------------- PORT ---------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`http://localhost:${PORT} - listening...`));
