import vscode = require('vscode');
import * as cp from "child_process";

// SymbolDocProvider implements the LSP's textDocument.documentSymbol SPEC
// Currently, it depends on `bufls`
export class SymbolDocProvider implements vscode.DocumentSymbolProvider {
	// TODO(scnace): we can cache the result for a while
	readonly binaryPath: string = '';
	constructor(binaryPath: string) {
		if (!binaryPath || binaryPath.length === 0) {
			throw new Error('binaryPath is required to construct a formatter');
		}
		this.binaryPath = binaryPath;
	}

	public async provideDocumentSymbols(
		document: vscode.TextDocument,
		token: vscode.CancellationToken
	): Promise<vscode.SymbolInformation[]> {
		return this.runSymbolCmd(document, token).then(
			(symbols) => {
				return symbols;
			},
			(err) => {
				console.log(err);
				return Promise.reject('Check the console in dev tools to find errors when formatting.');
			}
		);
	}

	public runSymbolCmd(
		doc: vscode.TextDocument,
		token: vscode.CancellationToken,
	): (Thenable<vscode.SymbolInformation[]>) {
		return new Promise<vscode.SymbolInformation[]>((resolve, reject) => {
			const p = cp.spawn(this.binaryPath, ['symbol', doc.uri.fsPath]);
			token.onCancellationRequested(() => !p.killed && p.kill());
			p.stdout.setEncoding('utf8');
			let symbols = '';
			let stderr = '';
			p.stdout.on('data', (data: any) => {
				symbols += data;
			})
			p.stderr.on('data', (data: any) => {
				stderr += data
			})
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
					this.parseSymbolOutput(doc,symbols)
				);
			})
		})
	}

	private parseSymbolOutput(
		doc: vscode.TextDocument,
		output: string,
	): vscode.SymbolInformation[] {
		if (!output) {
			return [];
		}
		const symbols: vscode.SymbolInformation[] = [];
		if (!output.startsWith('[')) {
			return [];
		}
		JSON.parse(output).forEach((symbol: any) => {
			const pos = new vscode.Position(
				symbol.range.start.line-1, 0,
			);
			const loc = new vscode.Location(doc.uri, pos);
			let ds = new vscode.SymbolInformation(
				symbol.name,
				symbol.kind,
				"",
				loc,
			);
			symbols.push(ds);
			if (symbol.children) {
				symbol.children.forEach((child: any) => {
					const pos = new vscode.Position(
						child.range.start.line-1, 0,
					);
					const loc = new vscode.Location(doc.uri, pos);
					let ds = new vscode.SymbolInformation(
						child.name,
						child.kind,
						symbol.name,
						loc,
					);
					symbols.push(ds);
				});
			}
		});
		return symbols;
	}


}
