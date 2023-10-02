const { userDetails, getWishlist } = require("../controllers/user");

const router = require("express").Router();

router.get("/user", userDetails);
router.get("/user/wishlist", getWishlist);

module.exports = router;
