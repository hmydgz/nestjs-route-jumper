import * as vscode from 'vscode';
import { getNonce } from './utils';
import { ProjectAnalysis } from './project';

export class SilderWebviewProvider implements vscode.WebviewViewProvider {

  public static readonly viewType = 'webview';

  private _view?: vscode.WebviewView;
  projectAnalysis: ProjectAnalysis;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) {
    this.projectAnalysis = new ProjectAnalysis();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(data => {
      console.log('onDidReceiveMessage', data)
      this.projectAnalysis.onMessage(data)
    });

    this.projectAnalysis.postMessage = (message: any) => {
      console.log('postMessage', message)
      webviewView.webview.postMessage(message)
    }
  }

  public postMessage(message: any) {
    console.log('postMessage', message, this._view)
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage(message);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'out.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <!--
          Use a content security policy to only allow loading styles from our extension directory,
          and only allow scripts that have a specific nonce.
          (See the 'webview-sample' extension sample for img-src content security policy examples)
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="${codiconsUri}" rel="stylesheet" />
        <link href="${styleUri}" rel="stylesheet" />

        <!-- <script>
          window.process = { env: { NODE_ENV: 'production' } }
        </script> -->

        <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
        <title>Nestjs Route Jumper</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
      </html>`;
  }
}