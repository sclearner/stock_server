import express from "express";
import cors from "cors";
import { db } from "./models/index.js";
import { authRouter } from "./routes/auth.route.js";
import { execSync } from "child_process";
import endPoints from "express-list-endpoints";

const app = express();

// Middleware
app.use(cors());

//parse requests of content type 'application/json'
app.use(express.json());

//parse requests of content type 'application/x-www-form-urlencoded'
app.use(express.urlencoded({ extended: true }));

//Authenticate database
let dbAuthTry = 0;
async function dbAuth() {
  await db.sequelize
    .authenticate()
    .then(() => {
      console.log("Connection has been established successfully.");
    })
    .catch(async (err) => {
      execSync("pg_ctl restart");
      if (dbAuthTry++ < 5) {
        console.log(`Retry time: ${dbAuthTry}`);
        dbAuth();
      }
      console.error("Unable to connect to the database:", err);
    });
}

dbAuth();
app.use("/api/v1/auth", authRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
