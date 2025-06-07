import * as vscode from 'vscode';
import { getNonce } from './utils';
import { ProjectAnalysis } from './project';
import { setPostMessage } from './utils/postMessage';

/**
 * 侧边栏
 */
export class SilderWebviewProvider implements vscode.WebviewViewProvider {

  public static readonly viewType = 'webview';

  // private _view?: vscode.WebviewView;
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
    // this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(data => {
      this.projectAnalysis.onMessage(data)
    });

    setPostMessage((message: any) => webviewView.webview.postMessage(message))
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'out.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
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
        <link href="${styleUri}" rel="stylesheet" />

        <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
        <title>Nestjs Route Jumper</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
      </html>`;
  }
}