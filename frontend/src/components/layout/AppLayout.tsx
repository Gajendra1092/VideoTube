import { Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import Header from './Header'
import Sidebar from './Sidebar'

const AppLayout = () => {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      <Header />
      <div className="flex">
        <Sidebar />
        <main 
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-16'
          } pt-16`}
        >
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
