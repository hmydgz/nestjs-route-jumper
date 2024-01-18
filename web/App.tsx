import './App.less'
import SearchInput from './components/SearchInput'
import { StoreProvider, useStore } from './store'
import ProjectList from './components/ProjectList'
import { LineMdLoadingTwotoneLoop } from './components/Icon'

function App() {
  const [store] = useStore()

  return (
    <StoreProvider>
      <div className='relative pb-2'>
        <SearchInput />
        { store.loadingSearch
          ? <span className='text-xl'><LineMdLoadingTwotoneLoop /></span>
          : <ProjectList /> }
      </div>
    </StoreProvider>
  )
}

export default App
