import { useCallback, useEffect } from "react"
import { requestCallback } from "../utils/requset"
import { RequestMessage } from "../../src/types"

export const useMessage = (callback: (data: RequestMessage) => any) => {
  const _callback = useCallback(callback, [])
  useEffect(() => {
    const onMessage = (res: MessageEvent<any>) => {
      requestCallback(res.data)
      _callback(res.data)
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])
}