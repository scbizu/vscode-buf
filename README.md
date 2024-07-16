# Buf for Visual Studio Code

## Installation

1. install the extension by `make package`
2. and then install the generated `code --install-extension vscode-buf-0.6.3-unofficial.vsix` locally


## Features

- It provides the missing feature of vscode's `Go To Definition`

## Requirements

- [buf](https://docs.buf.build/installation)
- [bufls](https://github.com/bufbuild/buf-language-server)

## Extension Settings

This extension contributes the following settings:

- `buf.binaryPath`: configure the path to your buf binary. By default it uses `buf` in your `$PATH`.

- `buf.binaryLSPPath`: configure the path to your bufls binary. By default it uses `bufls` in your `$PATH`.
