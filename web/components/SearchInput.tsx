import React, { useState } from "react"
import { sendMessage } from "../utils"

const SearchInput: React.FC = () => {
  const [searchStr, setSearchStr] = useState('')

  return <div className="search-bar">
    <input
      type="text"
      placeholder="请输入"
      onChange={e => setSearchStr(e.target.value)}
      onKeyDown={e => {
        if (e.key !== 'Enter') return
        sendMessage({ type: 'search', data: searchStr })
      }}
    />
  </div>
}

export default SearchInput