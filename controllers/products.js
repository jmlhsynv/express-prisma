const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const fs = require("fs");
const removeFiles = require("../utils/removeFiles");

// get all products with category and images
const getProducts = async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  let decodedData = jwt.verify(token, process.env.SECRET_TOKEN);
  try {
    let products = await prisma.product.findMany({
      include: {
        category: true,
        images: {
          select: {
            id: true,
            path: true,
          },
        },
        wishlist: {
          where: {
            userId: decodedData?.id,
          },
          select: {
            productId: true,
          },
        },
      },
    });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// get single product with category and images
const getSingleProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        category: true,
        images: {
          select: {
            id: true,
            path: true,
          },
        },
      },
    });
    return res.status(200).json(product);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// create product and upload it's images
const postProduct = async (req, res) => {
  const { name, price, description, categoryId } = req.body;
  const files = req.files;
  try {
    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        categoryId: Number(categoryId),
        images: {
          create: files.map((file) => ({
            path: `${req.protocol}://${req.get("host")}/${file.path}`,
          })),
        },
      },
      include: {
        category: true,
        images: {
          select: {
            id: true,
            path: true,
          },
        },
      },
    });
    return res.status(201).json(product);
  } catch (error) {
    removeFiles(files);
    return res.status(400).json({ error: error.message });
  }
};

// delete product with it's images
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const images = await prisma.productImages.findMany({
      where: {
        productId: Number(id),
      },
    });

    const product = await prisma.product.delete({
      where: {
        id: Number(id),
      },
    });

    if (images && images?.length > 0) {
      images.forEach((e) => {
        fs.unlinkSync(
          e.path.substring(e.path.indexOf("uploads"), e.path.length)
        );
      });
    }

    return res.status(204).json(product);
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

// update product details
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.update({
      where: {
        id: Number(id),
      },
      data: req.body,
      include: { category: true },
    });
    return res.status(200).json(product);
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

// add image to product
const addImages = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });
    if (!product) {
      removeFiles(files);
      return res
        .status(400)
        .json({ message: `There no product with id ${id}` });
    }

    if (product._count.images + files.length > 5) {
      removeFiles(files);

      return res.status(400).json({
        message: `This product has ${
          product._count.images
        } images. You can add ${5 - product._count.images} image(s)`,
      });
    }
    let pathes = [];
    files.forEach((e) => {
      pathes.push({
        path: `${req.protocol}://${req.get("host")}/${e.path}`,
        productId: Number(id),
      });
    });

    await prisma.productImages.createMany({
      data: pathes,
    });

    let createdData = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        images: true,
      },
    });

    return res.status(201).json(createdData);
  } catch (error) {
    removeFiles(files);
    return res.status(400).json({ error: error });
  }
};

// delete product image
const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await prisma.productImages.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!image)
      return res
        .status(400)
        .json({ message: `There is no image with id ${id}` });

    const product = await prisma.product.findUnique({
      where: { id: image.productId },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (product._count.images < 2) {
      return res
        .status(400)
        .json({ message: `Product should has at least 1 image` });
    }

    await prisma.productImages.delete({ where: { id: Number(id) } });

    fs.unlinkSync(
      image.path.substring(image.path.indexOf("uploads"), image.path.length)
    );
    return res.status(204);
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

module.exports = {
  getProducts,
  getSingleProduct,
  deleteProduct,
  postProduct,
  updateProduct,
  addImages,
  deleteProductImage,
};
