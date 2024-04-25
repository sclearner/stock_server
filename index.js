import os from 'os';
import cluster from 'cluster';

console.log(`CPU: ${os.cpus().length}`);

for (let i = 0; i < os.cpus().length; i++) {
  cluster.fork();
}
cluster.on("exit", (worker, code, signal) => {
  console.log(`worker ${worker.process.pid} has been killed`);
  console.log("Starting another worker");
  cluster.fork();
});