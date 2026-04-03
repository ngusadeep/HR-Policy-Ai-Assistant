import { getRouteApi } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DocumentsDialogs } from './components/documents-dialogs'
import { DocumentsPrimaryButtons } from './components/documents-primary-buttons'
import { DocumentsProvider } from './components/documents-provider'
import { DocumentsTable } from './components/documents-table'
import { documents } from './data/documents'

const route = getRouteApi('/_authenticated/dashboard/documents/')

export function Documents() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <DocumentsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Policy Documents</h2>
            <p className='text-muted-foreground'>
              Manage your HR policy documents and the AI knowledge base.
            </p>
          </div>
          <DocumentsPrimaryButtons />
        </div>
        <DocumentsTable data={documents} search={search} navigate={navigate} />
      </Main>

      <DocumentsDialogs />
    </DocumentsProvider>
  )
}
