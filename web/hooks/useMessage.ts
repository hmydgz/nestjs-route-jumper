import { useEffect } from "react"
import { requestCallback } from "../utils/requset"

export const useMessage = () => {
  useEffect(() => {
    const onMessage = (res: MessageEvent<any>) => {
      requestCallback(res.data)
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])
}