"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, DollarSign, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GuideModal from "./GuideModal";

const THRESHOLDS = {
  영업이익률: { good: 15, moderate: 8, bad: 5 },
  순이익률: { good: 10, moderate: 5, bad: 2 },
  부채비율: { good: 50, moderate: 100, bad: 200 },
  유동비율: { good: 200, moderate: 150, bad: 100 },
};

const evaluateFinancialStatus = (ratios) => {
  const scores = {
    수익성: 0,
    안정성: 0,
  };

  if (ratios.영업이익률 >= THRESHOLDS.영업이익률.good) scores.수익성 += 2;
  else if (ratios.영업이익률 >= THRESHOLDS.영업이익률.moderate)
    scores.수익성 += 1;

  if (ratios.순이익률 >= THRESHOLDS.순이익률.good) scores.수익성 += 2;
  else if (ratios.순이익률 >= THRESHOLDS.순이익률.moderate) scores.수익성 += 1;

  if (ratios.부채비율 <= THRESHOLDS.부채비율.good) scores.안정성 += 2;
  else if (ratios.부채비율 <= THRESHOLDS.부채비율.moderate) scores.안정성 += 1;

  if (ratios.유동비율 >= THRESHOLDS.유동비율.good) scores.안정성 += 2;
  else if (ratios.유동비율 >= THRESHOLDS.유동비율.moderate) scores.안정성 += 1;

  const totalScore = scores.수익성 + scores.안정성;

  if (totalScore >= 7)
    return { status: "매우좋음", emoji: "😊", color: "bg-green-100" };
  if (totalScore >= 5)
    return { status: "양호", emoji: "🙂", color: "bg-blue-100" };
  if (totalScore >= 3)
    return { status: "보통", emoji: "😐", color: "bg-yellow-100" };
  if (totalScore >= 1)
    return { status: "주의", emoji: "😕", color: "bg-orange-100" };
  return { status: "위험", emoji: "😧", color: "bg-red-100" };
};

const FinancialAnalysis = ({
  companyName = "",
  data = null,
  isLoading = false,
  error = null,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState(companyName);

  const handleSearch = React.useCallback(
    (term: string) => {
      if (term) {
        router.push(`/?company=${encodeURIComponent(term)}`);
      } else {
        router.push("/");
      }
    },
    [router]
  );

  if (!data && !isLoading && !error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">회사 재무정보 분석</h2>
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  placeholder="회사명을 입력하세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                  onClick={() => handleSearch(searchTerm)}
                  disabled={!searchTerm}
                >
                  <Search className="h-4 w-4 mr-2" />
                  검색
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4">재무정보를 분석중입니다...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg">😢 분석 중 오류가 발생했습니다</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ratios = {
    영업이익률: ((data.영업이익 / data.매출액) * 100).toFixed(1),
    순이익률: ((data.당기순이익 / data.매출액) * 100).toFixed(1),
    부채비율: ((data.부채총계 / data.자본총계) * 100).toFixed(1),
    유동비율: ((data.유동자산 / data.유동부채) * 100).toFixed(1),
  };

  const status = evaluateFinancialStatus(ratios);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="회사명을 입력하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              onClick={() => handleSearch(searchTerm)}
              disabled={!searchTerm || isLoading}
            >
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
            <GuideModal />
          </div>
        </CardContent>
      </Card>

      <Card className={status.color}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl mb-2">{status.emoji}</div>
            <div className="text-2xl font-bold mb-2">
              {companyName}의 재무상태: {status.status}
            </div>
            <div className="text-gray-600">
              수익성(영업이익률 {ratios.영업이익률}%)과 안정성(부채비율{" "}
              {ratios.부채비율}%)을 고려한 종합 평가입니다.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              수익성 지표
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span>영업이익률</span>
                  <span
                    className={`font-bold ${
                      Number(ratios.영업이익률) >= THRESHOLDS.영업이익률.good
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {ratios.영업이익률}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  기준: 15% 이상 우수, 8% 이상 양호
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span>순이익률</span>
                  <span
                    className={`font-bold ${
                      Number(ratios.순이익률) >= THRESHOLDS.순이익률.good
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {ratios.순이익률}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  기준: 10% 이상 우수, 5% 이상 양호
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              안정성 지표
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span>부채비율</span>
                  <span
                    className={`font-bold ${
                      Number(ratios.부채비율) <= THRESHOLDS.부채비율.good
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {ratios.부채비율}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  기준: 50% 이하 우수, 100% 이하 양호
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span>유동비율</span>
                  <span
                    className={`font-bold ${
                      Number(ratios.유동비율) >= THRESHOLDS.유동비율.good
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {ratios.유동비율}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  기준: 200% 이상 우수, 150% 이상 양호
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            주요 재무정보 (단위: 백만원)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{key}</div>
                <div className="font-bold">{value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialAnalysis;
