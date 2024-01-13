import { SVGProps } from "react"
import { Methods, SearchResult } from "../../src/types"
import { CodiconSymbolMethod, CarbonHttp, TablerHttpDelete, TablerHttpGet, TablerHttpPost, TablerHttpPut, CodiconGoToFile, TablerHttpPatch, TablerHttpOptions, TablerHttpHead } from './Icon'

const MethodMap: Record<string, (args: SVGProps<SVGSVGElement>) => JSX.Element> = {
  Get: TablerHttpGet,
  Post: TablerHttpPost,
  Put: TablerHttpPut,
  Delete: TablerHttpDelete,
  Patch: TablerHttpPatch,
  Options: TablerHttpOptions,
  Head: TablerHttpHead,
  All: CarbonHttp,
}

const MethodIconColorMap = {
  Get: 'rgb(107,221,154)',
  Post: 'rgb(255,228,123)',
  Put: 'rgb(116,174,246)',
  Delete: 'rgb(240,145,135)',
  Patch: 'rgb(192,168,225)',
  Options: 'rgb(241,94,176)',
  Head: 'rgb(107,221,154)',
  All: 'rgb(107,221,154)',
}

const ReqMapping: React.FC<{ mappings: SearchResult[] }> = ({ mappings }) => {
  return (<div className="grid grid-cols-1 gap-1">
    { mappings.map(v => {
      const Icon = MethodMap[v.method] ?? TablerHttpGet
      return <div className="group rounded hover:bg-black/30 px-2 py-1 transition-all">
        <div className="flex items-center gap-1">
          <div className="text-xl" title={v.method}><Icon style={{ color: MethodIconColorMap[v.method] }} /></div>
          <div className="text-sm">{ v.path }</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="text-base"><CodiconSymbolMethod style={{ color: 'var(--vscode-symbolIcon-methodForeground)' }} /></div>
          <div className="text-sm">{ v.name }</div>
          <div className="ml-auto opacity-0 group-hover:opacity-100"><CodiconGoToFile /></div>
        </div>
      </div>
    }) }
  </div>)
}

export default ReqMapping