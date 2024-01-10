import './App.less'
import SearchInput from './components/SearchInput'
import { useMessage } from './hooks/useMessage'
import { StoreProvider } from './store'
import ProjectList from './components/ProjectList'

function App() {
  useMessage()

  return (
    <StoreProvider>
      <div className='relative'>
        <SearchInput />
        <ProjectList />
      </div>
    </StoreProvider>
  )
}

export default App
