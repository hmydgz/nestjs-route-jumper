import { createCustomStore } from './utils'
import { BaseActionTuple, Res, SearchResult } from '../../src/types'
import { StoreActionType } from '../types'

const initalState = {
  searchStr: '',
  loadingSearch: false,
  projects: [] as Res.Project[],
}

type Store = typeof initalState

type AllAction = BaseActionTuple<[
  [StoreActionType.SET_SEARCH_STR, string],
  [StoreActionType.SET_SEARCH_LOADING, boolean],
  [StoreActionType.SET_SEARCH_RESULT, Res.Project[]]
]>

function reducer(state = initalState, action: AllAction): Store {
  switch (action.type) {
    case StoreActionType.SET_SEARCH_STR:
      return { ...state, searchStr: action.data }
    case StoreActionType.SET_SEARCH_LOADING:
      return { ...state, loadingSearch: action.data }
    case StoreActionType.SET_SEARCH_RESULT:
      return { ...state, projects: action.data }
    default: return state
  }
}

export const [StoreProvider, useStore] = createCustomStore({ initalState, reducer })