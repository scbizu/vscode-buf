import * as path from "path";
import * as vscode from "vscode";
import { existsSync } from "fs";
import pkg from "../package.json";

const defaultBinaryPath =
  pkg.contributes.configuration.properties["buf.binaryPath"].default;
const defaultLSPBinaryPath =
  pkg.contributes.configuration.properties["buf.binaryLSPPath"].default;

const getWorkspaceFolderFsPath = (outputChannel: vscode.OutputChannel) => {
  if (vscode.workspace.workspaceFolders === undefined) {
    outputChannel.appendLine("workspace folders was undefined");
    outputChannel.show();
    return;
  }
  if (vscode.workspace.workspaceFolders.length === 0) {
    outputChannel.appendLine("workspace folders was not set");
    outputChannel.show();
    return;
  }
  const uri = vscode.workspace.workspaceFolders[0].uri;
  if (uri.scheme !== "file") {
    outputChannel.appendLine(`uri was not file: ${uri.scheme}`);
    outputChannel.show();
    return;
  }
  return uri.fsPath;
};

export const getBinaryPath = (outputChannel: vscode.OutputChannel) => {
  const workspaceFolderFsPath = getWorkspaceFolderFsPath(outputChannel);
  if (workspaceFolderFsPath === undefined) {
    return {};
  }
  let binaryPath = vscode.workspace
    .getConfiguration("buf")!
    .get<string>("binaryPath");
  if (binaryPath === undefined) {
    outputChannel.appendLine("buf binary path was not set");
    outputChannel.show();
    return {};
  }

  if (!path.isAbsolute(binaryPath) && binaryPath !== defaultBinaryPath) {
    // check if file exists
    binaryPath = path.join(workspaceFolderFsPath, binaryPath);

    if (!existsSync(binaryPath)) {
      outputChannel.appendLine(`buf binary path does not exist: ${binaryPath}`);
      outputChannel.show();
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
    .getConfiguration("buf")!
    .get<string>("binaryLSPPath");

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
