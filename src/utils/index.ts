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

export function joinPath(path1: string, path2: string) {
	return `${path1}${path1.endsWith('/') ? '' : '/'}${path2 ? path2.startsWith('/') ? path2.substring(1, path2.length) : path2 : ''}`
}

export function debounce<T extends (...rest: any) => void>(fn: T, wait = 100) {
	let timer: NodeJS.Timeout | undefined
	const _fn = (...rest: any) => {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			fn(...rest as any)
			timer = undefined
		}, wait)
	}
	return _fn
}