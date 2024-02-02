import { useMemo } from "react"
import { Res } from "../../src/types"
import ReqMapping from "./ReqMapping"
import { CodiconSymbolClass } from './Icon'

const AppList: React.FC<{ apps: Res.App[] }> = ({ apps }) => {
  const renderApps = useMemo(() => apps.filter(v => v.mappings.length), [apps])
  return (<div>
    { renderApps.map(v => <>
      { v.name ? <div className="flex items-center py-1">
        <CodiconSymbolClass className="text-lg" />
        <span className="pl-1">{ v.name }</span>
      </div> : null }
      <ReqMapping mappings={v.mappings} />
    </>) }
  </div>)
}

export default AppList