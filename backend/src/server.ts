import * as dotenv from "dotenv";
import { app } from "./app";

dotenv.config();
const port = 4000;

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
