import * as _ from "lodash";

import * as item from "../item";

export interface K8SClient {
  all(namespace: string): item.Item[];
  apply(path: string): string;
  remove(path: string): string;
}

export class Synchronizer {
  client: K8SClient;
  outputFolder: string;
  namespace: string;
  currentItems: { [key: string]: item.Item };

  constructor(init: {
    client: K8SClient;
    outputFolder: string;
    namespace: string;
  }) {
    this.client = init.client;
    this.outputFolder = init.outputFolder;
    this.namespace = init.namespace;
  }

  sync() {
    const items = this.client.all(this.namespace);

    const itemsChanged = item.createOrUpdateAll(items, this.outputFolder);

    const unupdatedItems = this.unupdatedItems(itemsChanged);

    const itemsRemoved = item.removeAll(unupdatedItems);
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
    return _.chain(this.currentItems)
      .keys()
      .filter(name => !_.find(latestItems, iName => iName === name))
      .value();
  }
}
