import React, { useEffect, useState } from "react"
import { requset } from "../utils/requset"
import { EventType, Res } from '../../src/types'
import { useStore } from "../store"
import { StoreActionType } from "../types"
import { sendMessage } from "../utils"
import { useMessage } from "../hooks/useMessage"

const SearchInput: React.FC = () => {
  const [store, dispatch] = useStore()

  const handleSearch = async(e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    submitSearch()
  }

  const submitSearch = async () => {
    try {
      dispatch({ type: StoreActionType.SET_SEARCH_LOADING, data: true })
      const res = await requset<Res.Project[]>({ type: EventType.SEARCH, data: store.searchStr })
      sendMessage({ type: 'search res', res })
      dispatch({
        type: StoreActionType.SET_SEARCH_RESULT,
        data: res
      })
    } catch (error) {
    } finally { dispatch({ type: StoreActionType.SET_SEARCH_LOADING, data: false }) }
  }

  useEffect(() => { submitSearch() }, [])

  useMessage(({ type }) => {
    switch (type) {
      case EventType.WEIVIEW_REFRESH:
        submitSearch()
        break
    }
  })

  return <div className="search-bar sticky top-0 pb-2 shadow">
    <input
      value={store.searchStr}
      placeholder="请输入访问路径"
      onChange={e => dispatch({ type: StoreActionType.SET_SEARCH_STR, data: e.target.value })}
      onKeyDown={handleSearch}
    />
  </div>
}

export default SearchInput