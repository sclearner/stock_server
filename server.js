import express from "express";
import cors from "cors";
import { db } from "./models/index.js";
import { authRouter } from "./routes/auth.route.js";
import { exec } from "child_process";
import util from "util";
import endPoints from "express-list-endpoints";
import { TraderRouter as traderRouter } from "./routes/trader.route.js";
import { instrumentRouter } from "./routes/instrument.route.js";
import { orderRouter } from "./routes/order.route.js";
import currencyConfig from "./configs/currency.config.js";

console.clear();

const app = express();
const execPromise = util.promisify(exec);

let timeLeft = 0;
const checkDay = setInterval(
  async () => {
    const updateAt = new Date(await db.sequelize.query('SELECT "updatedAt" FROM time'));
  }, 24 * 60 * 60 * 1000
)


// Middleware
app.use(cors());

//parse requests of content type 'application/json'
app.use(express.json());

//parse requests of content type 'application/x-www-form-urlencoded'
app.use(express.urlencoded({ extended: true }));

//Authenticate database
let dbAuthTry = 0;
let retryFunction;
async function dbAuth() {
  console.log(`Connect try: ${dbAuthTry + 1}`);
  await db.sequelize
    .authenticate()
    .then(() => {
      console.log("Connection has been established successfully.");
    })
    .catch(retryFunction);
}

retryFunction = async (err) => {
  execPromise("pg_ctl restart")
    .then(async () => {
      await dbAuth();
    })
    .catch((err) => {
      if (dbAuthTry++ < 5) {
        retryFunction(err);
      } else {
        console.error("Unable to connect to the database:", err);
      }
    });
};

await dbAuth();
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/trader", traderRouter);
app.use("/api/v1/instrument", instrumentRouter);
app.use("/api/v1/order", orderRouter);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("------------------ API List -------------------")
  console.log(
    endPoints(app)
    .map((e) => e.methods.map((f) => `${f}: ${e.path}`).join("\n"))
    .join("\n\n")
);
});

