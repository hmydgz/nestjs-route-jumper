const VSCODE_API = acquireVsCodeApi();

export function sendMessage(...message: any[]) {
  console.log('sendMessage', ...message)
  VSCODE_API.postMessage(...message);
}