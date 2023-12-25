const VSCODE_API = acquireVsCodeApi();

console.log = (...args) => sendMessage({ type: 'web-log', msg: args });

function sendMessage(message: any) {
  VSCODE_API.postMessage(message);
}