import './App.less'
import SearchInput from './components/SearchInput'
import { StoreProvider, useStore } from './store'
import ProjectList from './components/ProjectList'
import { SvgSpinnersRingResize } from './components/Icon'
import { requset } from './utils/requset'
import { EventType } from '../src/types'
import { useEffect } from 'react'
import { StoreActionType } from './types'
import clsx from 'clsx'
import { useMessage } from './hooks/useMessage'

function View() {
  const [store, dispatch] = useStore()

  async function update() {
    dispatch({
      type: StoreActionType.SET_PROJECTS,
      data: await requset({ type: EventType.GET_PROJECTS }),
    })
    dispatch({ type: StoreActionType.SEARCH })
  }

  useEffect(() => {
    update()
    ;(async () => dispatch({
      type: StoreActionType.SET_BASE_URL,
      data: await requset<string>({ type: EventType.GET_BASE_PATH }),
    }))()
  }, [])

  useMessage(async ({ type }) => {
    switch (type) {
      case EventType.WEIVIEW_REFRESH:
        update()
        break
    }
  })

  return <div className='relative pb-2'>
    <SearchInput />
    <span
      className={clsx(
        'fixed left-0 top-8 z-10 w-full text-5xl flex items-center justify-center transition-all bg-black/60',
        store.loadingSearch ? 'opacity-100' : 'opacity-0 select-none pointer-events-none',
      )}
      style={{
        height: 'calc(100vh - 32px)',
        backdropFilter: 'saturate(180%) blur(5px);',
      }}
    >
      <SvgSpinnersRingResize />
    </span>
    { !store.loadingSearch && <ProjectList /> }
  </div>
}

function App() {
  return (
    <StoreProvider>
      <View />
    </StoreProvider>
  )
}

export default App
