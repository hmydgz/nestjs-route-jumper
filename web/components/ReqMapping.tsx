import { SearchResult } from "../../src/types"
import { CodiconSymbolMethod, TablerHttpDelete, TablerHttpGet, TablerHttpPost, TablerHttpPut } from './Icon'

const MethodMap: Record<string, (args: any) => JSX.Element> = {
  Get: TablerHttpGet,
  Post: TablerHttpPost,
  Put: TablerHttpPut,
  Delete: TablerHttpDelete,
  All: TablerHttpPut,
}

const ReqMapping: React.FC<{ mappings: SearchResult[] }> = ({ mappings }) => {
  return (<div className="pl-2">
    { mappings.map(v => {
      const Icon = MethodMap[v.method] ?? TablerHttpGet
      return <div>
        <div className="flex items-center gap-1">
          <div className="text-base"><Icon /></div>
          <div className="text-sm">{ v.path }</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="text-base"><CodiconSymbolMethod style={{ color: 'var(--vscode-symbolIcon-methodForeground)' }} /></div>
          <div className="text-sm">{ v.name }</div>
        </div>
      </div>
    }) }
  </div>)
}

export default ReqMapping