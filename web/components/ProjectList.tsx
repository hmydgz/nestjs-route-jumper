
import { useStore } from "../store"
import AppList from "./AppList"

const ProjectList: React.FC = () => {
  const [store] = useStore()

  return (<div>
    { store.projects.map(v => v.apps.length && <div>
      <div>{ v.dirPath }</div>
      <AppList apps={v.apps} />
    </div>) }
  </div>)
}

export default ProjectList