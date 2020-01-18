import * as _ from "lodash";

import * as item from "../item";

export interface K8SClient {
  all(namespace: string): item.Item[];
  apply(path: string): string;
  remove(path: string): string;
}

export interface Watcher {
  watch: () => void;
  unwatch: () => void;
}

export class Synchronizer {
  client: K8SClient;
  outputFolder: string;
  namespace: string;
  currentItems: { [key: string]: item.Item };
  watcher: Watcher;

  constructor(init: {
    client: K8SClient;
    outputFolder: string;
    namespace: string;
    watcher: Watcher;
  }) {
    this.client = init.client;
    this.outputFolder = init.outputFolder;
    this.namespace = init.namespace;
    this.watcher = init.watcher;
  }

  sync() {
    const items = this.client.all(this.namespace);

    this.watcher.unwatch();

    const itemsChanged = item.createOrUpdateAll(items, this.outputFolder);

    const unupdatedItems = this.unupdatedItems(itemsChanged);

    const itemsRemoved = item.removeAll(unupdatedItems);

    this.watcher.watch();

    this.updateCurrentItems(items);
  }

  private updateCurrentItems(items: item.Item[]): void {
    this.currentItems = _.reduce(
      items,
      (acc, i) => {
        const itemPath = item.path(i, this.outputFolder);
        acc[itemPath] = i;
        return acc;
      },
      {}
    );
  }

  private unupdatedItems(latestItems: string[]): string[] {
    const currentItems = item.names(this.outputFolder);

    return _.filter(
      currentItems,
      name => !_.find(latestItems, iName => iName === name)
    );
  }
}
