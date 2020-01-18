import * as fs from "fs-extra";

import * as shell from "shelljs";
import * as yaml from "js-yaml";
import * as k8s from "@kubernetes/client-node";
import * as _ from "lodash";
import * as chokidar from "chokidar";

import * as item from "./item";
import * as log from "./log";
import * as kubectl from "./kubectl";
import * as sync from "./synchronizer";

const interval = 5000;
const outputFolder = "cluster";
const namespace = "default";
const itemsMap = {};

if (fs.existsSync(outputFolder)) {
  fs.removeSync(outputFolder);
}

fs.mkdirSync(outputFolder);

// const watcher = chokidar.watch("cluster");

const k8sClient = {
  all: kubectl.all,
  apply: kubectl.apply,
  remove: kubectl.remove
};

const synchronizer = new sync.Synchronizer({
  client: k8sClient,
  outputFolder,
  namespace
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
