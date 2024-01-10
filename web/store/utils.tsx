import React, { createContext, Dispatch, ReactNode, Reducer, useContext, useReducer } from 'react'
import store from 'store'

export function createCustomStore<T, R>(options: {
  initalState: T,
  reducer: Reducer<T, R>,
  storgeKey?: string
}): [React.FC<{ children: ReactNode }>, () => [T, Dispatch<R>]] {
  const { initalState, reducer, storgeKey } = options

  const _reducer = storgeKey
    ? (state: T, action: R) => {
      const _state = reducer(state, action)
      store.set(storgeKey, _state)
      return _state
    }
    : reducer

  const Context = createContext<{ state: T, dispatch: Dispatch<R> }>({
    state: initalState,
    dispatch: () => { }
  })

  function Provider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(_reducer, initalState)
    return <Context.Provider value={{ state, dispatch }}>
      {children}
    </Context.Provider>
  }

  function useStore(): [T, Dispatch<R>] {
    const { state, dispatch } = useContext(Context)
    return [state, dispatch]
  }

  return [Provider, useStore]
}