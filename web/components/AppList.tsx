import { useMemo } from "react"
import { Res } from "../../src/types"
import ReqMapping from "./ReqMapping"
import { CodiconSymbolClass } from './Icon'
import clsx from "clsx"

const AppList: React.FC<{ apps: Res.App[] }> = ({ apps }) => {
  const renderApps = useMemo(() => apps.filter(v => v.mappings.length), [apps])
  return (<div>
    {renderApps.map(v => <>
      {v.name ? <div className="flex items-center py-1">
        <CodiconSymbolClass className="text-lg" />
        <span className="pl-1">{v.name}</span>
      </div> : null}
      <div className={clsx(v.name ? 'pl-1' : '')}>
        <ReqMapping mappings={v.mappings} />
      </div>
    </>)}
  </div>)
}

export default AppList