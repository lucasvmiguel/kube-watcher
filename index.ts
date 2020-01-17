import * as fs from "fs-extra";

import * as shell from "shelljs";
import * as yaml from "js-yaml";
import * as k8s from "@kubernetes/client-node";
import * as _ from "lodash";
import * as chokidar from "chokidar";
import * as glob from "glob";

const interval = 5000;
const outputFolder = "cluster";
const namespace = "default";
const itemsMap = {};

if (fs.existsSync(outputFolder)) {
  fs.removeSync(outputFolder);
}

fs.mkdirSync(outputFolder);

const watcher = chokidar.watch("cluster");

const log = (message: string): void => {
  console.log(`[${new Date().toUTCString()}]: ${message}`);
};

const itemPath = (item: any, outputFolder: string): string => {
  if (!item || !item.metadata) {
    return "";
  }

  const apiVersion = _.replace(item.apiVersion, "/", "-");
  return `${outputFolder}/${item.metadata.namespace}/${item.kind}_${apiVersion}/${item.metadata.name}.yml`;
};

const deleteItem = (item: any, outputFolder: string): string => {
  if (!item) {
    return "";
  }

  if (!fs.existsSync(outputFolder)) {
    return;
  }

  const path = itemPath(item, outputFolder);
  fs.removeSync(path);

  return path;
};

const createRequiredFoldersForItem = (item: any, outputFolder: string) => {
  const namespaceFolder = `${outputFolder}/${item.metadata.namespace}`;
  if (!fs.existsSync(namespaceFolder)) {
    fs.mkdirSync(namespaceFolder);
  }

  const apiVersion = _.replace(item.apiVersion, "/", "-");
  const kindFolder = `${namespaceFolder}/${item.kind}_${apiVersion}`;
  if (!fs.existsSync(kindFolder)) {
    fs.mkdirSync(kindFolder);
  }

  return kindFolder;
};

const createOrUpdateItem = (item: any, outputFolder: string): string => {
  if (!item) {
    return "";
  }

  createRequiredFoldersForItem(item, outputFolder);

  const filePath = itemPath(item, outputFolder);

  fs.writeFileSync(filePath, yaml.dump(item));

  return filePath;
};

const createOrUpdateItems = (items: any[], outputFolder: string) => {
  return _.map(items, item => createOrUpdateItem(item, outputFolder));
};

const currentItemsPath = (outputFolder: string) => {
  return glob.sync(`${outputFolder}/**/*.yml`);
};

const deleteUnsyncItems = (itemsPath: string[], outputFolder: string) => {
  const currentItems = currentItemsPath(outputFolder);
  currentItems.forEach(currentItem => {
    if (!itemsPath.find(itemPath => itemPath === currentItem)) {
      deleteItem(currentItem, outputFolder);
    }
  });
};

const populateFiles = (files: any, items: any[], outputFolder: string) => {
  _.forEach(items, item => (files[itemPath(item, outputFolder)] = item));
};

const syncItems = (namespace: string, outputFolder: string) => {
  const response = shell.exec(`kubectl get all -n ${namespace} -o yaml`, {
    silent: true
  }).stdout;
  const responseYaml = yaml.load(response);
  const items = responseYaml.items;

  const itemsChanged = createOrUpdateItems(items, outputFolder);

  deleteUnsyncItems(itemsChanged, outputFolder);

  populateFiles(itemsMap, itemsChanged, outputFolder);
};

const shouldAddItem = (items: any, path: string): boolean => {
  if (!items[path]) {
    return false;
  }

  const fileContent = fs.readFileSync(path).toString();
  if (!fileContent) {
    return false;
  }

  return true;
};

setInterval(() => syncItems(namespace, outputFolder), interval);

watcher
  .on("add", path => {
    if (!shouldAddItem(itemsMap, path)) {
      return;
    }

    const filePath = `${__dirname}/${path}`;
    log(`applying item: ${filePath}`);
    shell.exec(`kubectl apply -f ${filePath}`);

    syncItems(namespace, outputFolder);
    log("items synchronized");
  })
  .on("unlink", path => {
    const filePath = `${__dirname}/${path}`;
    log(`deleting item: ${filePath}`);
    log(`kubectl delete -f ${filePath}`);
    shell.exec(`kubectl delete -f ${filePath}`);

    // syncItems(namespace, outputFolder);
  });

console.log("Press any key to exit");

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("data", process.exit.bind(process, 0));
