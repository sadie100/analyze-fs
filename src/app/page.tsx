import { Suspense } from "react";
import FinancialAnalysis from "./FinancialAnalysis";
import { SearchParams } from "@/types";

async function fetchFinancialData(companyName: string) {
  return {
    매출액: 1000000,
    영업이익: 150000,
    당기순이익: 100000,
    자산총계: 2000000,
    부채총계: 800000,
    자본총계: 1200000,
    유동자산: 900000,
    유동부채: 400000,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const companyName = searchParams.company;
  let data = null;
  let error = null;

  if (companyName) {
    try {
      data = await fetchFinancialData(companyName);
    } catch (e) {
      error =
        e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다";
    }
  }

  return (
    <Suspense
      fallback={
        <FinancialAnalysis
          isLoading={true}
          companyName=""
          data={null}
          error={null}
        />
      }
    >
      <FinancialAnalysis
        companyName={companyName || ""}
        data={data}
        error={error}
      />
    </Suspense>
  );
}
