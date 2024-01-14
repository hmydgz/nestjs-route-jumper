
import { useStore } from "../store"
import { Res } from "../../src/types"
import ReqMapping from "./ReqMapping"

const AppList: React.FC<{ apps: Res.App[] }> = ({ apps }) => {

  return (<div>
    { apps.map(v => v.mappings.length ? <ReqMapping appName={v.name} mappings={v.mappings} /> : null) }
  </div>)
}

export default AppList