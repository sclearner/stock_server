import express from "express";
import cors from "cors";
import os from "os";
import { resolve } from "path";
import cluster from "cluster";
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

// if (cluster.isPrimary) {
//   for (let i=0; i < os.cpus().length; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`Worker process ${worker.process.pid} died. Restarting...`);
//     cluster.fork();
//   });
// }
// else {

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

//Frontend
app.use(express.static('public'));

//Authenticate database
let dbAuthTry = 0;
let retryFunction;
async function dbAuth() {
  await db.sequelize
    .authenticate().then(
      async () => {
      await db.sequelize.sync({force: true});
      await db.Instrument.create({
        symbol: currencyConfig.defaultCurrency
      })
    }
  )
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

      }
    });
};

await dbAuth();

app.get('/', (req, res) => {
  res.sendFile(resolve('index.html'));
})

app.get('/api/test', (req, res) => {
  let i = 0;
  for (; i < 50_000_000; i++);
  res.json({i});
});

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

// }