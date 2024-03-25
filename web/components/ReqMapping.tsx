import { FC, SVGProps, useState } from "react"
import { EventType, SearchResult } from "../../src/types"
import { CodiconSymbolMethod, CarbonHttp, TablerHttpDelete, TablerHttpGet, TablerHttpPost, TablerHttpPut, CodiconGoToFile, TablerHttpPatch, TablerHttpOptions, TablerHttpHead, CodiconArrowRight, TablerCopy, TablerCopyCheckFilled } from './Icon'
import { requset } from "../utils/requset"

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

function handleJumperToMethod(target: SearchResult) {
  requset({ type: EventType.JUMP_TO_METHOD, data: target })
}

const Path: FC<{ data: SearchResult }> = ({ data }) => {
  return <>{ data.match ? data.match.map((v, i) => (
    <span style={{ background: v.keyword ? 'var(--vscode-editor-findMatchHighlightBackground)' : '' }}>{ v.text }</span>
  )) : data.path }</>
}

const Item: FC<{ data: SearchResult }> = ({ data }) => {
  const Icon = MethodMap[data.method] ?? TablerHttpGet
  const [isCopySuccess, setIsCopySuccess] = useState(false)

  function handleCopyPath(e: React.MouseEvent<SVGSVGElement>) {
    e.stopPropagation()
    navigator.clipboard.writeText(data.path).then(() => {
      setIsCopySuccess(true)
      setTimeout(() => setIsCopySuccess(false), 1000)
    })
  }

  const CopyIcon = isCopySuccess ? TablerCopyCheckFilled : TablerCopy

  return <div className="group rounded hover:bg-black/30 px-1 py-0.5" onClick={() => handleJumperToMethod(data)}>
    <div className="flex items-center gap-1">
      <div className="text-xl" title={data.method}><Icon style={{ color: MethodIconColorMap[data.method] }} /></div>
      <div className="text-sm flex-1 text-ellipsis whitespace-nowrap overflow-hidden" style={{ color: 'var(--vscode-breadcrumb-foreground)' }}>
        <Path data={data} />
      </div>
      <CopyIcon className="opacity-0 group-hover:opacity-100 text-sm" onClick={(e) => handleCopyPath(e)} />
    </div>
    <div className="flex items-center gap-1">
      <div className="text-base"><CodiconSymbolMethod style={{ color: 'var(--vscode-symbolIcon-methodForeground)' }} /></div>
      <div className="text-sm flex-1 text-ellipsis whitespace-nowrap overflow-hidden">
        { data.className ? <>
          <span className="text-#4ec9b0">{ data.className }</span>
          <span>.</span>
        </> : null }
        <span className="text-#dcdcaa">{ data.fnName }</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100"><CodiconArrowRight /></div>
    </div>
  </div>
}

const ReqMapping: React.FC<{ mappings: SearchResult[] }> = ({ mappings }) => {
  return (<div className="grid grid-cols-1">
    { mappings.map(v => <Item data={v} key={v.path} />) }
  </div>)
}

export default ReqMapping