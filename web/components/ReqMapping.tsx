import { SearchResult } from "../../src/types"

const ReqMapping: React.FC<{ mappings: SearchResult[] }> = ({ mappings }) => {
  return (<div className="pl-2">
    { mappings.map(v => <div>
      <div>{ v.method } { v.path }</div>
      <div>{ v.name }</div>
    </div>) }
  </div>)
}

export default ReqMapping