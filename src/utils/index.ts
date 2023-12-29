import * as fs from 'fs';
import * as path from 'path';
export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function getIndexFilePath(_path: string, indexName = 'index.ts') {
	const stat = fs.lstatSync(_path)
	if (stat.isFile()) { // 是文件
		return _path
	} else if (stat.isDirectory()) { // 是目录
		const indexPath = path.resolve(_path, indexName)
		if (fs.existsSync(indexPath) && fs.lstatSync(indexPath).isFile()) {
			return indexPath
		} else {
			return undefined
		}
	}
}