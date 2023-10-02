const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
// const db = require("./config/database");
const path = require("path");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "test message" });
});
app.use("/api", require("./routes/products.routes"));
app.use("/api", require("./routes/auth.routes"));
app.use("/api", require("./routes/user.routes"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("server listening");
});
