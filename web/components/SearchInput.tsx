import React, { useEffect, useRef, useState } from "react"
import { useStore } from "../store"
import { StoreActionType } from "../types"

const SearchInput: React.FC = () => {
  const [store, dispatch] = useStore()
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async(e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    submitSearch()
  }

  const submitSearch = async () => {
    try {
      dispatch({ type: StoreActionType.SET_SEARCH_LOADING, data: true })
      dispatch({ type: StoreActionType.SET_SEARCH_STR, data: value })
      dispatch({ type: StoreActionType.SEARCH })
    } catch (error) {
    } finally {
      dispatch({ type: StoreActionType.SET_SEARCH_LOADING, data: false })
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
    submitSearch()
  }, [])

  return <div className="search-bar sticky top-0 pb-2 shadow">
    <input
      ref={inputRef}
      value={value}
      placeholder="Search"
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleSearch}
    />
  </div>
}

export default SearchInput