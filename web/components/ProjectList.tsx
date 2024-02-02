import { useStore } from "../store"
import AppList from "./AppList"
import { CodiconFolder } from "./Icon"

const ProjectList: React.FC = () => {
  const [store] = useStore()
  function getDir(path: string) {
    let _path = path.replace(store.baseUrl, '')
    if (_path.startsWith('\\')) return _path.substring(1, _path.length)
    return path.replace(store.baseUrl, '')
  }

  return (<>
    {store.renderProjects.map(v => v.apps.length ? <div>
      { v.dirPath ? <div className="py-1 flex items-center">
        <CodiconFolder className="text-base" />
        <span className="pl-1">{ getDir(v.dirPath) }</span>
        <span></span>
      </div> : null }
      <div className={store.renderProjects.length > 1 ? 'pl-1' : ''}>
        <AppList apps={v.apps} />
      </div>
    </div> : null)}
  </>)
}

export default ProjectList