import { Request, Response } from "express";

export default function routeHelper(
  req: Request,
  res: Response,
  cb: (req: Request, res: Response) => any
) {
  try {
    const result = cb(req, res);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
}
