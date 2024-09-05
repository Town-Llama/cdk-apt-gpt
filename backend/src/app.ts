import cors from "cors";
import express from "express";
import apiRoutes from "./api";
import { errorResponder } from "./middleware/errorResponder";

export const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiRoutes);
app.use(errorResponder);
