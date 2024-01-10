import React from "react"
import { requset } from "../utils/requset"
import { EventType, Res } from '../../src/types'
import { useStore } from "../store"
import { StoreActionType } from "../types"
import { sendMessage } from "../utils"

const SearchInput: React.FC = () => {
  const [store, dispatch] = useStore()

  const handleSearch = async(e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const res = await requset<Res.Project[]>({ type: EventType.SEARCH, data: store.searchStr })
    sendMessage({ type: 'search res', res })
    dispatch({
      type: StoreActionType.SET_SEARCH_RESULT,
      data: res
    })
  }

  return <div className="search-bar sticky top-0">
    <input
      value={store.searchStr}
      placeholder="请输入访问路径"
      onChange={e => dispatch({ type: StoreActionType.SET_SEARCH_STR, data: e.target.value })}
      onKeyDown={handleSearch}
    />
  </div>
}

export default SearchInput