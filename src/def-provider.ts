import fs = require('fs');
import * as cp from "child_process";
import * as os from "os";
import path = require('path');
import vscode = require('vscode');

// BufProvider is a class that implements the vscode.DefinitionProvider interface.
// Currently, it depends on the [bufls](https://github.com/bufbuild/buf-language-server)
export class BufProvider implements vscode.DefinitionProvider {
	readonly binaryPath: string = '';
	constructor(binaryPath: string) {
		if (!binaryPath || binaryPath.length === 0) {
			throw new Error('binaryPath is required to construct a formatter');
		}
		this.binaryPath = binaryPath;
	}
	public provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Definition> {
		const wordRange = document.getWordRangeAtPosition(position);
		const word = document.getText(wordRange);
		console.log(word);
		return this.runDefinitionProvider(document, position, token);
	}

	public runDefinitionProvider(
		doc: vscode.TextDocument,
		inputPos: vscode.Position,
		token: vscode.CancellationToken,
	): (Thenable<vscode.Definition>) {
		return new Promise<vscode.Definition>((resolve, reject) => {
			const pos = new vscode.Position(inputPos.line, inputPos.character);
			const p = cp.spawn(this.binaryPath, ['definition', this.buildLSPInput(doc, pos)]);
			token.onCancellationRequested(() => !p.killed && p.kill());
			p.stdout.setEncoding('utf8');
			let defPosition = '';
			let stderr = '';
			p.stdout.on('data', (data: any) => {
				defPosition += data;
			})
			p.stderr.on('data', (data: any) => {
				stderr += data
			})
			console.log(defPosition);
			p.on('error', (err: any) => {
				if (err && (<any>err).code === 'ENOENT') {
					return reject();
				}
			});
			p.on('close', (code: number) => {
				if (code !== 0) {
					return reject(stderr);
				}
				return resolve(
					this.parseDefinitionOutput(defPosition)
				);
			})
		})
	}

	private parseDefinitionOutput(output: string): vscode.Definition{
		const parts = output.split(':');
		const line = parseInt(parts[1]);
		const character = parseInt(parts[2]);
		const pos = new vscode.Position(line, character);
		const uri = vscode.Uri.file(parts[0]);
		return new vscode.Location(uri, pos);
	}

	private buildLSPInput(doc: vscode.TextDocument, pos: vscode.Position): string {
		return `${doc.uri.fsPath}:${pos.line}:${pos.character}`;
	}
}
