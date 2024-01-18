import { RequestMessage } from "../types"

let _postMessage: (...message: any) => void = () => {}

export function setPostMessage(fn: (...message: any[]) => any) {
  _postMessage = fn
}

export function postMessage(message: RequestMessage) {
  try { _postMessage(message) } catch (error) {}
}