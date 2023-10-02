const {
  getProducts,
  getSingleProduct,
  postProduct,
  deleteProduct,
  updateProduct,
  addImages,
  deleteProductImage,
} = require("../controllers/products");
const authentication = require("../middleware/authentication");
const authorization = require("../middleware/authorization");

const upload = require("../utils/multer");

const router = require("express").Router();

router.get("/products", getProducts);
router.get("/products/:id", getSingleProduct);
router.post(
  "/products",
  authentication,
  authorization,
  upload.array("images"),
  postProduct
);
router.delete("/products/:id", authentication, authorization, deleteProduct);
router.patch("/products/:id", authentication, authorization, updateProduct);

router.post(
  "/products/:id/images",
  authentication,
  authorization,
  upload.array("images"),
  addImages
);

router.delete("/images/:id", authentication, authorization, deleteProductImage);

module.exports = router;
