import cors from "cors";
import express from "express";
import { globSync } from "glob";
import { errorResponder } from "./middleware/errorResponder";

export const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(apiRoutes);
app.use(errorResponder);

const files: string[] = globSync(__dirname + "/api/**/*.ts");
files.map((file) => {
  console.log("importing" + file);
  import(file.replace("src", ".")).then((module) => {
    app.use(module.default);
  });
});
