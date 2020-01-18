import * as fs from "fs-extra";
import * as _ from "lodash";
import * as yaml from "js-yaml";
import * as glob from "glob";

export interface Item {
  apiVersion: string;
  kind: string;
  spec: any;
  metadata: any;
  status: any;
}

export const remove = (itemPath: string): string => {
  fs.removeSync(itemPath);

  return itemPath;
};

export const removeAll = (itemsPath: string[]): string[] => {
  return _.map(itemsPath, itemPath => remove(itemPath));
};

export const createOrUpdate = (item: Item, outputFolder: string): string => {
  if (!item) {
    return "";
  }

  createRequiredFoldersForItem(item, outputFolder);

  const filePath = path(item, outputFolder);

  fs.writeFileSync(filePath, yaml.dump(item));

  return filePath;
};

export const createOrUpdateAll = (
  items: Item[],
  outputFolder: string
): string[] => {
  return _.map(items, i => createOrUpdate(i, outputFolder));
};

export const path = (item: Item, outputFolder: string): string => {
  if (!item || !item.metadata) {
    return "";
  }

  const apiVersion = _.replace(item.apiVersion, "/", "-");
  return `${outputFolder}/${item.metadata.namespace}/${item.kind}_${apiVersion}/${item.metadata.name}.yml`;
};

export const paths = (items: Item[], outputFolder: string): string[] => {
  return _.map(items, i => path(i, outputFolder));
};

export const names = (outputFolder: string): string[] => {
  return glob.sync(`${outputFolder}/**/*.yml`);
};

const createRequiredFoldersForItem = (item: Item, outputFolder: string) => {
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
