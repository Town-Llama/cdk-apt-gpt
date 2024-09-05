import { Router } from "express";

const router = Router();

router.post("/modelOne", async (req, res) => {
  res.status(200).json({ empty: "" });
});

router.post("/modelTwo", async (req, res) => {
  res.status(200).json({ empty: "" });
});

export default router;
