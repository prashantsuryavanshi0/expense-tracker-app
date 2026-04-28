import express from "express";
import Expense from "../models/Expense.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET
router.get("/", verifyToken, async (req, res) => {
  const expenses = await Expense.find({ userId: req.user.id });
  res.json(expenses);
});

// ADD
router.post("/", verifyToken, async (req, res) => {
  const { amount, category } = req.body;

  const expense = new Expense({
    userId: req.user.id,
    amount,
    category,
  });

  await expense.save();
  res.json(expense);
});

// DELETE
router.delete("/:id", verifyToken, async (req, res) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.json("Deleted");
});

export default router;