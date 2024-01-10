
import { useStore } from "../store"
import { Res } from "../../src/types"
import ReqMapping from "./ReqMapping"

const AppList: React.FC<{ apps: Res.App[] }> = ({ apps }) => {

  return (<div className="pl-2">
    { apps.map(v => v.mappings.length ? <div>
      <div>{ v.name }</div>
      <ReqMapping mappings={v.mappings} />
    </div> : null) }
  </div>)
}

export default AppList