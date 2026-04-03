import { ShieldCheck } from 'lucide-react'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='container grid h-svh max-w-none items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-120 sm:p-8'>
        <div className='mb-4 flex items-center justify-center gap-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
            <ShieldCheck className='h-5 w-5' />
          </div>
          <h1 className='text-xl font-semibold tracking-tight'>HR Policy Assistant</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
