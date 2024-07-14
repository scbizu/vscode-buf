import * as path from "path";
import * as vscode from "vscode";
import { existsSync } from "fs";
import pkg from "../package.json";

const defaultBinaryPath =
  pkg.contributes.configuration.properties["buf.binaryPath"].default;
const defaultLSPBinaryPath =
  pkg.contributes.configuration.properties["buf.binaryLSPPath"].default;

const getWorkspaceFolderFsPath = () => {
  if (vscode.workspace.workspaceFolders === undefined) {
    console.log("workspace folders was undefined");
    return;
  }
  if (vscode.workspace.workspaceFolders.length === 0) {
    console.log("workspace folders was not set");
    return;
  }
  const uri = vscode.workspace.workspaceFolders[0].uri;
  if (uri.scheme !== "file") {
    console.log("uri was not file: ", uri.scheme);
    return;
  }
  return uri.fsPath;
};

export const getBinaryPath = () => {
  const workspaceFolderFsPath = getWorkspaceFolderFsPath();
  if (workspaceFolderFsPath === undefined) {
    return {};
  }
  let binaryPath = vscode.workspace
    .getConfiguration("buf")!
    .get<string>("binaryPath");
  if (binaryPath === undefined) {
    console.log("buf binary path was not set");
    return {};
  }

  if (!path.isAbsolute(binaryPath) && binaryPath !== defaultBinaryPath) {
    // check if file exists
    binaryPath = path.join(workspaceFolderFsPath, binaryPath);

    if (!existsSync(binaryPath)) {
      console.log("buf binary path does not exist: ", binaryPath);
      return {};
    }
  }
  return {
    cwd: workspaceFolderFsPath,
    binaryPath,
  };
};

export const getLSPBinaryPath = () => {
  const workspaceFolderFsPath = getWorkspaceFolderFsPath();
  if (workspaceFolderFsPath === undefined) {
    return {};
  }
  // Currently , the buf lsp server is `bufls`
  // But the migration is happening ,see for details: https://github.com/bufbuild/buf/pull/2662
  let lspBinaryPath = vscode.workspace
    .getConfiguration("bufls")!
    .get<string>("lspBinaryPath");

  if (lspBinaryPath === undefined) {
    console.log("bufls binary path was not set");
    return {};
  }

  if (!path.isAbsolute(lspBinaryPath) && lspBinaryPath !== defaultLSPBinaryPath) {
    // check if file exists
    lspBinaryPath = path.join(workspaceFolderFsPath, lspBinaryPath);

    if (!existsSync(lspBinaryPath)) {
      console.log("bufls binary path does not exist: ", lspBinaryPath);
      return {};
    }
  }
  return {
    cwd: workspaceFolderFsPath,
    lspBinaryPath,
  };
};
