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
        if (['', '/'].includes(value)) return _app.mappings.push(v)
        const [result, match, weight] = isMatch(v.path, value)
        if (result) _app.mappings.push({ ...v, match, weight })
      })
      _app.mappings.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      _app.mappings.length && _projects.apps.push(_app)
    })
    _projects.apps.length && list.push(_projects)
  })

  return list
}

function isMatch(_path: string, value: string): [boolean, { text: string, keyword: boolean }[], number] {
  const _value = value.split('?')[0]
  if (_path.includes(':')) {
    // 感觉还是默认不开纯参数搜索好点
    // // 直接当成参数
    // if (!_value.includes('/')) return true
    const _paths = _path.split('/').filter(v => v)
    const _values = _value.split('/').filter(v => v)
    // 能匹配到的起始位置
    let startItemIndex = -1
    let startItemIsParams = false
    for (let index = 0; index < _paths.length; index++) {
      const element = _paths[index];
      if (element.endsWith(_values[0])) {
        startItemIndex = index
        break
      } else if (element.includes(':')) {
        startItemIndex = index
        startItemIsParams = true
        break
      }
    }

    // 超长 /api/redis/:xxx 无法匹配 redis/123/123 这种情况
    if ((_paths.length - startItemIndex) < _values.length) return [false, [], 0]

    let startMatchStr = startItemIsParams ? _paths[startItemIndex] : _values[0]
    let matchWeight = 0

    for (let index = 1; index < _values.length; index++) {
      const __path = _paths[index + startItemIndex]
      const __value = _values[index]
      // 末尾了就只从前面匹配
      if (index === _values.length - 1) {
        if (__path.includes(':')) {
          startMatchStr += `/${__path}`
          matchWeight += 0.5
          continue
        } else if (__path.startsWith(__value)) {
          startMatchStr += `/${__value}`
          matchWeight += 1
          continue
        }
      }
      // 参数部分，跳过
      if (__path.includes(':')) {
        startMatchStr += `/${__path}`
        matchWeight += 0.5
        continue
      }
      // 中间的需要完全匹配
      if (__path !== __value) return [false, [], 0]
      startMatchStr += `/${__path}`
      matchWeight += 1
    }
    const match = createMatch(startMatchStr, _path)
    return [true, match, matchWeight / _values.length]
  } else {
    return _path.includes(_value) ? [true, createMatch(_value, _path), 1] : [false, [], 0]
  }
}

function createMatch(keyword: string, _path: string) {
  const reg = new RegExp(keyword, 'g')
  const arr = _path.split(reg)
  const matchArr = _path.match(reg)
  const result = []
  for (let i = 0; i < arr.length; i++) {
    result.push({ text: arr[i], keyword: false })
    if (matchArr && matchArr[i]) {
      result.push({ text: matchArr[i], keyword: true })
    }
  }
  return result
}

export const [StoreProvider, useStore] = createCustomStore({ initalState, reducer })