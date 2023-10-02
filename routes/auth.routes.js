const router = require("express").Router();

const { register, login, refreshTokens } = require("../controllers/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshTokens);

module.exports = router;
