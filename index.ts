import * as fs from "fs-extra";

import * as _ from "lodash";
import * as chokidar from "chokidar";

import * as log from "./log";
import * as kubectl from "./kubectl";
import * as sync from "./synchronizer";
import * as watcher from "./watcher";

const interval = 5000;
const outputFolder = "cluster";
const namespace = "default";

if (fs.existsSync(outputFolder)) {
  fs.removeSync(outputFolder);
}

fs.mkdirSync(outputFolder);

const K8SClient = {
  all: kubectl.all,
  apply: kubectl.apply,
  remove: kubectl.remove
};

const watcherObj = new watcher.Watcher(outputFolder);

watcherObj.onRemove((path: string) => {
  const filePath = `${__dirname}/${path}`;
  log.message(`deleting item: ${filePath}`);
  K8SClient.remove(filePath);
});

watcherObj.onCreate((path: string) => {
  const filePath = `${__dirname}/${path}`;
  log.message(`creating item: ${filePath}`);
  K8SClient.apply(filePath);
});

const synchronizer = new sync.Synchronizer({
  client: K8SClient,
  outputFolder,
  namespace,
  watcher: watcherObj
});

setInterval(() => synchronizer.sync(), interval);

// watcher
//   .on("add", path => {
//     if (!shouldAddItem(itemsMap, path)) {
//       return;
//     }

//     const filePath = `${__dirname}/${path}`;
//     log.message(`applying item: ${filePath}`);
//     kubectl.apply(filePath);

//     syncItems(namespace, outputFolder);
//     log.message("items synchronized");
//   })
//   .on("unlink", path => {
//     const filePath = `${__dirname}/${path}`;
//     log.message(`deleting item: ${filePath}`);
//     log.message(`kubectl delete -f ${filePath}`);
//     kubectl.remove(filePath);

//     // syncItems(namespace, outputFolder);
//   });

console.log("Press any key to exit");

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("data", process.exit.bind(process, 0));
