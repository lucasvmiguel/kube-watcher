import * as shell from "shelljs";
import * as yaml from "js-yaml";

export const all = (namespace: string) => {
  const response = execShell(`kubectl get all -n ${namespace} -o yaml`);
  const responseYaml = yaml.load(response);
  return responseYaml.items;
};

export const apply = (path: string) => {
  return execShell(`kubectl apply -f ${path}`);
};

export const remove = (path: string) => {
  return execShell(`kubectl delete -f ${path}`);
};

const execShell = (script: string) => {
  return shell.exec(script, {
    silent: true
  }).stdout;
};
