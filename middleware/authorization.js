const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authorization = async (req, res, next) => {
  try {
    let user = await prisma.users.findUnique({
      where: {
        id: req.userId,
      },
    });
    if (user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden content" });
    }
  } catch (error) {}
};

module.exports = authorization;
