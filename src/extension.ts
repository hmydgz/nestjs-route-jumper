import * as vscode from 'vscode';
import { SilderWebviewProvider } from './webview';
export function activate(context: vscode.ExtensionContext) {
	const provider = new SilderWebviewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(SilderWebviewProvider.viewType, provider));
}