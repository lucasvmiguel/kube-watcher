import "mocha";
import { expect } from "chai";

import * as fs from "fs-extra";
import * as yaml from "js-yaml";
import * as glob from "glob";
import * as _ from "lodash";

import * as sync from "../synchronizer";

class K8SClientMock {
  file: string;

  constructor(file: string) {
    this.file = file;
  }

  setFile(file: string) {
    this.file = file;
  }

  all(namespace: string) {
    const response = fs.readFileSync(this.file).toString();
    const responseYaml = yaml.load(response);
    return responseYaml.items;
  }

  apply(path: string) {
    return `applying ${path}`;
  }

  remove(path: string) {
    return `removing ${path}`;
  }
}

describe("First test", () => {
  const outputFolder = "./test/cluster-test";
  const mockFolder = "./mock";

  beforeEach(() => {
    if (fs.existsSync(outputFolder)) {
      fs.removeSync(outputFolder);
    }

    fs.mkdirSync(outputFolder);
  });

  it("should generate items then add one and then remove one", () => {
    const k8sClient = new K8SClientMock(`${mockFolder}/get-all-mock.yml`);
    const watcher = { watch: () => undefined, unwatch: () => undefined };
    const synchronizer = new sync.Synchronizer({
      client: k8sClient,
      outputFolder,
      namespace: "default",
      watcher
    });

    // normal items
    synchronizer.sync();
    checkFiles(glob.sync(`${outputFolder}/**/*.yml`), "cluster-all");

    // extra one item
    k8sClient.setFile(`${mockFolder}/get-all-mock-with-extra.yml`);
    synchronizer.sync();
    checkFiles(glob.sync(`${outputFolder}/**/*.yml`), "cluster-all-with-extra");

    // normal items again
    k8sClient.setFile(`${mockFolder}/get-all-mock.yml`);
    synchronizer.sync();
    checkFiles(glob.sync(`${outputFolder}/**/*.yml`), "cluster-all");
  });

  const checkFiles = (filesGenerated: string[], expectedFolder: string) => {
    _.forEach(filesGenerated, file => {
      const resultFile = fs.readFileSync(file).toString();
      const expectedFolderReplaced = _.replace(
        file,
        outputFolder,
        `${mockFolder}/${expectedFolder}`
      );
      const expectedFile = fs.readFileSync(expectedFolderReplaced).toString();

      expect(resultFile).to.be.equal(expectedFile);
    });
  };
});
