import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';
import OpenAI from "openai";
import * as path from 'path';
import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";

enum KI_TYPE {
    CHAT_GPT = 'ChatGPT',
    CLAUDE = 'Claude',
    GEMINI = 'Gemini'
}

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    private _disposables: vscode.Disposable[] = [];
    private chatGPT = new OpenAI({
        apiKey: vscode.workspace.getConfiguration('apiKey').get(KI_TYPE.CHAT_GPT)
    });
    private anthorpicClaude = new Anthropic({apiKey: vscode.workspace.getConfiguration('apiKey').get(KI_TYPE.CLAUDE)})
    private googleGemini = new GoogleGenerativeAI(vscode.workspace.getConfiguration('apiKey').get(KI_TYPE.GEMINI) ?? '');

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getWebviewContent(webviewView.webview);

        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(webviewView.webview);


        webviewView.webview.onDidReceiveMessage(async (data: { kiType: KI_TYPE; text: string }) => {
            if (!data.text) {
                return;
            }
            this.generateTest(data.text, data.kiType);
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

    private async generateTest(promptText: string, kiType: KI_TYPE) {
        // Get the current active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        const editorContent = editor.document.getText();
        if (!editorContent) {
            vscode.window.showErrorMessage('Content of active editor is empty!');
            return;
        }

        if (!this.chatGPT) {
            vscode.window.showErrorMessage('No active instance of ChatGPT!');
            return;
        }

        let completion;

        const prompt = `${promptText} React-Komponente: ${editorContent}`

        switch (kiType) {
            case KI_TYPE.CHAT_GPT:
                completion = await this.getChatGptCompletion(prompt);
                break;
            case KI_TYPE.CLAUDE:
                completion = await this.getClaudeCompletion(prompt);
                break;
            case KI_TYPE.GEMINI:
                completion = await this.getGeminiCompletion(prompt);
                break;
        }

        if (completion) {
            this.createUnitTestFile(completion, editor);
        }
    }

    private async getClaudeCompletion (promptText: string) {
        try {
            const completion = await this.anthorpicClaude.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 4000,
                messages: [
                    {
                        role: 'user',
                        content: promptText
                    }
                ]
            })

            return completion.content[0].text;
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating unit test: ${error}`);
        }
    }

    private async getGeminiCompletion (promptText: string) {
        try {        
            const model = this.googleGemini.getGenerativeModel({model: 'gemini-1.0-pro'})
            return await  model.generateContent(promptText).then((response) => response.response.text());
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating unit test: ${error}`);
        }
    }

    private async getChatGptCompletion(promptText: string) {
        try {
            const chatGPTCompletion = await this.chatGPT.chat.completions.create({
                messages: [{ role: 'system', content: promptText }],
                model: 'gpt-3.5-turbo'
            });
            
            return chatGPTCompletion.choices[0].message.content != null ? chatGPTCompletion.choices[0].message.content : undefined;
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating unit test: ${error}`);
        }
    }

    private createUnitTestFile(unitTestCode: string, editor: vscode.TextEditor) {
        const fileNameStrings = editor.document.fileName.split('/')
        const dotSeparatedFilename = fileNameStrings[fileNameStrings.length - 1].split('.')
        const fileNameOfTestFile = [dotSeparatedFilename[0], 'test', dotSeparatedFilename[1]].join('.');

        const workspaceFolder = vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : null;

        if (workspaceFolder) {
            const testFileName = path.join(workspaceFolder, fileNameOfTestFile);
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



