import { createCustomStore } from './utils'
import { BaseActionTuple, Res, SearchResult } from '../../src/types'
import { StoreActionType } from '../types'

const initalState = {
  searchStr: '',
  baseUrl: '',
  loadingSearch: false,
  projects: [] as Res.Project[],
  renderProjects: [] as Res.Project[],
}

type Store = typeof initalState

type AllAction = BaseActionTuple<[
  [StoreActionType.SET_SEARCH_STR, string],
  [StoreActionType.SET_SEARCH_LOADING, boolean],
  [StoreActionType.SET_PROJECTS, Res.Project[]],
  [StoreActionType.SET_BASE_URL, string],
  [StoreActionType.SEARCH],
]>

function reducer(state = initalState, action: AllAction): Store {
  switch (action.type) {
    case StoreActionType.SET_SEARCH_STR:
      return { ...state, searchStr: action.data }
    case StoreActionType.SET_SEARCH_LOADING:
      return { ...state, loadingSearch: action.data }
    case StoreActionType.SET_PROJECTS:
      return { ...state, projects: action.data }
    case StoreActionType.SET_BASE_URL:
      return { ...state, baseUrl: action.data }
    case StoreActionType.SEARCH: {
      const renderProjects = search(state.searchStr, state.projects)
      return { ...state, renderProjects }
    }
    default: return state
  }
}

function search(value: string, projects: Res.Project[]): Res.Project[] {
  // 仅有一个项目时不显示名称
  const needShowProjectName = projects.length > 1
  const list: Res.Project[] = []
  projects.forEach(project => {
    // 仅有一个App时不显示名称
    const needShowAppName = project.apps.length > 1
    const _projects: Res.Project = {
      ...project,
      dirPath: needShowProjectName ? project.dirPath : '',
      apps: [],
    }
    project.apps.forEach(app => {
      const _app: Res.App = {
        ...app,
        name: needShowAppName ? app.name : '',
        mappings: [],
      }
      app.mappings.forEach(v => {
        (['', '/'].includes(value) || isMatch(v.path, value)) && _app.mappings.push(v)
      })
      _app.mappings.length && _projects.apps.push(_app)
    })

    _projects.apps.length && list.push(_projects)
  })

  return list
}

function isMatch(_path: string, value: string): boolean {
  const _value = value.split('?')[0]
  if (_path.includes(':')) {
    // 直接当成参数
    if (!_value.includes('/')) return true
    const _paths = _path.split('/').filter(v => v)
    const _values = _value.split('/').filter(v => v)
    // 能匹配到的起始位置
    const startItemIndex = _paths.findIndex(v => {
      if (v.includes(':')) return true
      return v.endsWith(_values[0])
    })
    // 超长 /api/redis/:xxx 无法匹配 redis/123/123 这种情况
    if ((_paths.length - startItemIndex) < _values.length) return false
    for (let index = 1; index < _values.length; index++) {
      const __path = _paths[index + startItemIndex]
      const __value = _values[index]
      // 参数部分，跳过
      if (__path.includes(':')) continue
      // 末尾了就只从前面匹配
      if (index === _values.length - 1 && __path.startsWith(__value)) continue
      // 中间的需要完全匹配
      if (__path !== __value) return false
    }
    return true
  } else {
    return _path.includes(_value)
  }
}

export const [StoreProvider, useStore] = createCustomStore({ initalState, reducer })