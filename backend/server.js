const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "secretkey";

// ===== MONGODB =====
mongoose.connect("mongodb://127.0.0.1:27017/expenseDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ===== MODELS =====
const User = mongoose.model("User", {
  email: String,
  password: String,
});

const Expense = mongoose.model("Expense", {
  userId: String,
  amount: Number,
  category: String,
  date: { type: Date, default: Date.now }
});

// ===== AUTH MIDDLEWARE =====
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) return res.status(401).json("No token");

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json("Invalid token");
  }
}

// ===== AUTH ROUTES =====
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json("Missing fields");

  const user = new User({ email, password });
  await user.save();

  res.json("User Registered");
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (!user) return res.status(400).json("Invalid");

  const token = jwt.sign({ id: user._id }, SECRET);

  res.json({ token });
});

// ===== EXPENSE ROUTES =====

// GET
app.get("/api/expenses", auth, async (req, res) => {
  try {
    const data = await Expense.find({ userId: req.user.id });
    res.json(data);
  } catch {
    res.status(400).json("Error fetching");
  }
});

// ADD
app.post("/api/expenses", auth, async (req, res) => {
  try {
    const { amount, category } = req.body;

    if (!amount || !category)
      return res.status(400).json("Missing fields");

    const expense = new Expense({
      userId: req.user.id,
      amount,
      category,
    });

    await expense.save();

    res.json("Added");
  } catch {
    res.status(400).json("Error adding");
  }
});

// DELETE
app.delete("/api/expenses/:id", auth, async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json("Deleted");
  } catch {
    res.status(400).json("Error deleting");
  }
});

// ===== SERVER =====
app.listen(5000, () => console.log("Server running on 5000"));