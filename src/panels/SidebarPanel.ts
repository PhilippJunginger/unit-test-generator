import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";
import * as fs from 'fs'
import * as path from 'path';
import OpenAI from "openai";

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    private _disposables: vscode.Disposable[] = [];
    private chatGPT: OpenAI | undefined;
    private orange = vscode.window.createOutputChannel("Orange");



    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        this.chatGPT = new OpenAI({
            apiKey: ''
        });

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getWebviewContent(webviewView.webview);

        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(webviewView.webview);


        webviewView.webview.onDidReceiveMessage(async (data: { command: string; text: string }) => {

            switch (data.command) {
                case "onInfo": {
                    if (!data.text) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.text);
                    break;
                }
                case "onError": {
                    if (!data.text) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.text);
                    break;
                }
                case "sendPrompt":
                    if (!data.text || !this.chatGPT) {
                        this.orange.appendLine(data.text);
                        return;
                    }

                    this.generateTest(data.text)
                    break;
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getWebviewContent(webview: vscode.Webview) {
        // The CSS file from the React build output
        const stylesUri = getUri(webview, this._extensionUri, ["webview-ui", "build", "assets", "index.css"]);
        // The JS file from the React build output
        const scriptUri = getUri(webview, this._extensionUri, ["webview-ui", "build", "assets", "index.js"]);

        const nonce = getNonce();
        this.orange.show()

        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
              <link rel="stylesheet" type="text/css" href="${stylesUri}">
              <title>Hello World</title>
            </head>
            <body>
              <div id="root"></div>
              <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
            </body>
          </html>
        `;
    }


    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is recieved.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     */
    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                const text = message.text;

                switch (command) {
                    case "hello":
                        // Code that should run in response to the hello message command
                        vscode.window.showInformationMessage(text);
                        return;
                    // Add more switch case statements here as more webview message commands
                    // are created within the webview context (i.e. inside media/main.js)
                }
            },
            undefined,
            this._disposables
        );
    }

    private async generateTest(promptText: string) {
        // Get the current active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        if (!this.chatGPT) {
            vscode.window.showErrorMessage('No active instance of ChatGPT!');
            return;
        }

        try {
            const test = await this.chatGPT.chat.completions.create({
                messages: [{ role: 'system', content: promptText }],
                model: 'gpt-3.5-turbo'
            });

            this.orange.appendLine(JSON.stringify(test))
            this.orange.appendLine(`${test.choices[0].message.content}`)

            vscode.window.showInformationMessage(`${test.choices[0].message.content}`);

            if (test.choices[0].message.content) {
                this.createUnitTestFile(test.choices[0].message.content)
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating unit test: ${error}`);
        }
    }

    private createUnitTestFile(unitTestCode: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const workspaceFolder = vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : null;

        if (workspaceFolder) {
            const testFileName = path.join(workspaceFolder, 'generatedTest.tsx');
            fs.writeFile(testFileName, unitTestCode, { encoding: 'utf8' }, (err) => {
                if (err) {
                    vscode.window.showErrorMessage('Error creating test file.');
                    return;
                }

                vscode.workspace.openTextDocument(testFileName).then((doc) => {
                    vscode.window.showTextDocument(doc);
                });
            });
        } else {
            vscode.window.showErrorMessage('No workspace folder found.');
        }
    }
}



