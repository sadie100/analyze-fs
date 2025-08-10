import FinancialResult from './FinancialResult'
import {
  loadFinancialDatabase,
  findCompanyByExactName,
  searchCompaniesByName,
} from '@/lib/company-search'
import { analyzeCompany, type AnalysisResult } from '@/lib/financial-analyzer'

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function Page({ searchParams }: PageProps) {
  const companyParam = searchParams?.company
  const company = typeof companyParam === 'string' ? companyParam : ''

  let data: AnalysisResult | null = null
  let usedExactMatch = true
  let error: string | null = null

  if (company) {
    try {
      const db = await loadFinancialDatabase()

      let companyData = await findCompanyByExactName({
        db,
        companyName: company,
      })

      if (!companyData) {
        usedExactMatch = false
        const results = await searchCompaniesByName({
          db,
          searchTerm: company,
          limit: 5,
        })
        if (results.length === 0) {
          error = `"${company}"와 일치하는 회사를 찾을 수 없습니다.`
        } else {
          const best = results[0]
          companyData = await findCompanyByExactName({ db, companyName: best })
          if (!companyData) {
            error = '데이터를 로드할 수 없습니다.'
          } else {
            data = analyzeCompany(best, companyData)
          }
        }
      } else {
        data = analyzeCompany(company, companyData)
      }
    } catch {
      error = '서버 처리 중 오류가 발생했습니다'
    }
  }

  return (
    <FinancialResult
      initialCompany={company}
      data={data}
      usedExactMatch={usedExactMatch}
      error={error}
    />
  )
}
