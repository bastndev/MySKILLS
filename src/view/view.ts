import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class YouTubeMusicViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'rene-yt-music-view';

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'search':
                    vscode.window.showInformationMessage(`Buscando música: ${message.value}`);
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Path to individual resources
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'view', 'ui', 'index.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'view', 'ui', 'index.css'));

        // Load the HTML content from the file
        const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'view', 'ui', 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Inject URIs into the HTML
        // We look for where to inject the CSS and JS
        html = html.replace('</head>', `<link rel="stylesheet" href="${styleUri}">\n</head>`);
        html = html.replace('</body>', `<script type="module" src="${scriptUri}"></script>\n</body>`);
        
        return html;
    }
}
