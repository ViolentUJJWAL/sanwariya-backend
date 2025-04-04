const cors = require("cors");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const connectDB = require("./db/db");
const dotenv = require("dotenv");
dotenv.config();
const adminAuth = require("./routes/adminRoutes/auth.routes");
const userAuth = require("./routes/userRoutes/auth.routes");
const adminProducts = require("./routes/adminRoutes/products.routes");
const userProducts = require("./routes/userRoutes/products.routes");
const orderRoutes = require("./routes/userRoutes/orderRoutes");
const couponRoutes = require("./routes/adminRoutes/couponRoutes");
const adminOrderRoutes = require("./routes/adminRoutes/orderRoutes");

const PORT = process.env.PORT || 5000;
const URL = process.env.MONGO_URI;
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "*",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:10000",
    ],
    credentials: true,
  })
);

app.use("/api/admin/auth", adminAuth);
app.use("/api/user/auth", userAuth);
app.use("/api/admin/products", adminProducts);
app.use("/api/user/products", userProducts);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/user/orders", orderRoutes);
app.use("/api/discount-coupons", couponRoutes);

app.listen(PORT, () => {
  connectDB(URL);
  console.log(`Server running on port ${PORT}`);
});
