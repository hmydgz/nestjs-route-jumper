import { useStore } from "../store"
import AppList from "./AppList"
import { CodiconFolder } from "./Icon"


function getCount(apps: any[]) {
  return apps.reduce((acc, cur) => acc + cur.mappings.length, 0)
}

const ProjectList: React.FC = () => {
  const [store] = useStore()
  function getDir(path: string) {
    let _path = path.replace(store.baseUrl, '')
    if (_path.startsWith('\\')) return _path.substring(1, _path.length).replace(/\\/g, '/')
    return path.replace(store.baseUrl, '').replace(/\\/g, '/')
  }

  return (<>
    {store.renderProjects.map(v => v.apps.length ? <div>
      { v.dirPath ? <div className="py-1 flex items-center">
        <CodiconFolder className="text-base" />
        <span className="pl-1">({store.searchStr ? getCount(v.apps) + '/' : ''}{ getCount(store.projects.find(_v => _v.dirPath === v.dirPath)?.apps ?? []) })</span>
        <span className="pl-1">{ getDir(v.dirPath) }</span>
      </div> : null }
      <div className={store.renderProjects.length > 1 ? 'pl-1' : ''}>
        <AppList apps={v.apps} />
      </div>
    </div> : null)}
    { !store.renderProjects.length && <div className="h-[calc(100vh-80px)] flex items-center justify-center">Empty</div> }
  </>)
}

export default ProjectList