import { Suspense } from 'react'
import FinancialAnalysis from './FinancialAnalysis'
import { SearchParams } from '@/types'

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const companyName = searchParams.company

  return (
    <Suspense
      fallback={
        <FinancialAnalysis
          isLoading={true}
          companyName=""
          initialData={null}
          error={null}
        />
      }
    >
      <FinancialAnalysis
        companyName={companyName || ''}
        initialData={null}
        error={null}
      />
    </Suspense>
  )
}
