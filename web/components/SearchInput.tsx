import React, { useEffect } from "react"
import { useStore } from "../store"
import { StoreActionType } from "../types"

const SearchInput: React.FC = () => {
  const [store, dispatch] = useStore()

  const handleSearch = async(e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    submitSearch()
  }

  const submitSearch = async () => {
    try {
      dispatch({ type: StoreActionType.SET_SEARCH_LOADING, data: true })
      dispatch({ type: StoreActionType.SEARCH })
    } catch (error) {
    } finally {
      dispatch({ type: StoreActionType.SET_SEARCH_LOADING, data: false })
    }
  }

  useEffect(() => { submitSearch() }, [])

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