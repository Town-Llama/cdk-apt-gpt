import { Router } from "express";

const router = Router();
export default router;

router.get("/health_check", (req, res) => {
  console.debug("health check running");
  res.status(200).json({ message: "ok" });
});
