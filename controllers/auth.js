const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res, next) => {
  const { fullName, username, email, password } = req.body;
  try {
    const user = await prisma.users.findMany({
      where: {
        OR: [
          {
            username: username,
          },
          {
            email: email,
          },
        ],
      },
    });
    if (user.length > 0) {
      return res
        .status(400)
        .json({ message: "This email or username is already exists !" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password length should be more than 6 symbols" });
    }
    const passHash = await bcrypt.hash(password, 12);
    const newUser = await prisma.users.create({
      data: {
        fullName,
        username,
        email,
        password: passHash,
      },
    });

    const accessToken = await jwt.sign(
      { id: newUser.id },
      process.env.SECRET_TOKEN,
      { expiresIn: "1h" }
    );
    const refreshToken = await jwt.sign(
      { id: newUser.id },
      process.env.SECRET_TOKEN,
      { expiresIn: "30d" }
    );
    res.status(201).json({
      user: {
        username: newUser.username,
        email: newUser.email,
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const login = async (req, res) => {
  /*  
    #swagger.tags = ['Auth']
*/
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required!" });
    }
    const user = await prisma.users.findUnique({
      where: {
        username: username,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "No account with this username" });
    }

    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const accessToken = jwt.sign({ id: user.id }, process.env.SECRET_TOKEN, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign({ id: user.id }, process.env.SECRET_TOKEN, {
      expiresIn: "30d",
    });
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const refreshTokens = async (req, res) => {
  /*  
    #swagger.tags = ['Auth']
*/
  try {
    const token = req.body.refresh;
    jwt.verify(token, process.env.SECRET_TOKEN, async (err, details) => {
      if (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
      } else {
        const { id } = details;
        const user = await prisma.users.findUnique({ where: { id: id } });

        if (user) {
          const accessToken = jwt.sign({ id }, process.env.SECRET_TOKEN, {
            expiresIn: "1h",
          });
          const refreshToken = jwt.sign({ id }, process.env.SECRET_TOKEN, {
            expiresIn: "30d",
          });

          return res.status(200).json({
            tokens: {
              access: accessToken,
              refresh: refreshToken,
            },
          });
        } else {
          return res.status(401).json({ message: "Invalid refresh token" });
        }
      }
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, error });
  }
};

module.exports = { register, login, refreshTokens };
