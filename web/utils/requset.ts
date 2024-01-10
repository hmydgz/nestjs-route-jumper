import { sendMessage } from "."
import { RequestMessage } from "../../out/types"

const reqMap = new Map<number, (value: any) => any>()

let msgId = 0
export function requset<T extends any>(req: RequestMessage) {
  const _msgId = msgId
  msgId++
  return new Promise<T>((resolve, reject) => {
    reqMap.set(_msgId, resolve)
    setTimeout(() => reject({ type: 'timeout' }), 10000)
    sendMessage({ ...req, msgId: _msgId })
  }).finally(() => {
    reqMap.delete(_msgId)
    sendMessage({ msg: `${_msgId} 完成` })
  })
}

export function requestCallback(res: any) {
  if (res.hasOwnProperty('msgId') && reqMap.has(res.msgId)) {
    sendMessage({ type: 'requset res', msgId: res.msgId, res })
    reqMap.get(res.msgId)!(res.data)
  }
}