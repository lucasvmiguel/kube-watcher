import * as fs from "fs-extra";
import * as shell from "shelljs";
import * as yaml from "js-yaml";
import * as _ from "lodash";

export const all = (namespace: string) => {
  const response = execShell(`kubectl get all -n ${namespace} -o yaml`);
  const responseYaml = yaml.load(response);
  return responseYaml.items;
};

export const apply = (path: string) => {
  return execShell(`kubectl apply -f ${path}`);
};

export const remove = (path: string) => {
  if (fs.existsSync(path)) {
    return execShell(`kubectl delete -f ${path}`);
  }

  const parts = _.split(path, "/");
  const name = _.replace(parts[parts.length - 1], ".yml", "");
  const kind = _.split(parts[parts.length - 2], "_")[0];
  const namespace = parts[parts.length - 3];

  console.log(`kubectl delete ${kind} -n ${namespace} ${name}`);
  return execShell(`kubectl delete ${kind} -n ${namespace} ${name}`);
};

const execShell = (script: string) => {
  return shell.exec(script, {
    silent: true
  }).stdout;
};
