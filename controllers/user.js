const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const exclude = require("../utils/exclude");

const userDetails = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    let decodedData = jwt.verify(token, process.env.SECRET_TOKEN);

    const user = await prisma.users.findUnique({
      where: { id: decodedData?.id },
    });

    const excludedUser = exclude(user, ["password", "isAdmin"]);

    return res.status(200).json(excludedUser);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    let decodedData = jwt.verify(token, process.env.SECRET_TOKEN);

    const wishList = await prisma.wishlist.findMany({
      where: { userId: decodedData.id },
      include: {
        product: true,
      },
    });
    return res.status(200).json(wishList);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const addToWishList = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    let decodedData = jwt.verify(token, process.env.SECRET_TOKEN);

    const { productId } = req.body;
    const hasInWishlist = await prisma.wishlist.findUnique({
      where: {
        userId: decodedData?.id,
        productId: Number(productId),
      },
    });
    if (hasInWishlist) {
      return res
        .status(400)
        .json({ message: "Product is already in wishlist" });
    }

    const wishList = await prisma.wishlist.create({
      data: {
        productId,
        userId: decodedData?.id,
      },
      include: {
        product: true,
      },
    });
    return res.status(200).json(wishList);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = { userDetails, getWishlist, addToWishList };
