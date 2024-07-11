import os from 'os';
import cluster from 'cluster';

for (let i = 0; i < os.cpus().length; i++) {
  cluster.fork();
}
cluster.on("exit", (worker, code, signal) => {
  cluster.fork();
});