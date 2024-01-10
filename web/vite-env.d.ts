/// <reference types="vite/client" />
import * as GG from '../out/types'

declare global {
  function acquireVsCodeApi(): {
		getState: () => WebViewState | null,
		postMessage: (...message: any[]) => void,
		setState: (state: WebViewState) => void
	};

  interface WebViewState {}
}

export {};