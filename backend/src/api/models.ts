import { Router } from "express";

const router = Router();
export default router;

router.post("/modelOne", async (req, res) => {
  res.status(200).json({ empty: "" });
});

router.post("/modelTwo", async (req, res) => {
  res.status(200).json({ empty: "" });
});
