import { Request, Response } from "express";

export default async function routeHelper(
  req: Request,
  res: Response,
  cb: (req: Request, res: Response) => Promise<any>
) {
  try {
    await cb(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
}
