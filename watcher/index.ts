import * as chokidar from "chokidar";

export class Watcher {
  path: string;
  toggle: boolean;
  client: chokidar.FSWatcher;

  constructor(path: string) {
    this.path = path;
    this.toggle = true;
    this.client = chokidar.watch(path);
  }

  watch() {
    this.toggle = true;
  }

  unwatch() {
    this.toggle = false;
  }

  onRemove(fn: (path: string) => void) {
    this.client.on("unlink", path => {
      if (!this.toggle) {
        return;
      }

      fn(path);
    });
  }

  onCreate(fn: (path: string) => void) {
    this.client.on("add", path => {
      if (!this.toggle) {
        return;
      }

      fn(path);
    });
  }

  onChange(fn: (path: string) => void) {
    this.client.on("change", path => {
      if (!this.toggle) {
        return;
      }

      fn(path);
    });
  }
}
