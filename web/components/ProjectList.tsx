
import { useStore } from "../store"
import AppList from "./AppList"

const ProjectList: React.FC = () => {
  const [store] = useStore()

  return (<>
    { store.projects.map(v => v.apps.length ? <div>
      <div className="pb-2">{ v.dirPath }</div>
      <AppList apps={v.apps} />
    </div> : null) }
  </>)
}

export default ProjectList