import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, ArrowUpCircle } from "lucide-react";

const ResponsiveFinancialGuide = () => {
  const metrics = {
    profitability: {
      title: "수익성 지표",
      icon: TrendingUp,
      description: "회사가 얼마나 돈을 잘 버는지 보여주는 지표예요",
      metrics: [
        {
          name: "영업이익률",
          formula: "영업이익 ÷ 매출액 × 100",
          description: "본업에서 얼마나 돈을 잘 버는지 알려주는 지표예요",
          goodRange: "10% 이상이면 좋음",
          example: "영업이익률 15%면 매출 100원당 15원의 이익을 남긴다는 뜻",
        },
        {
          name: "순이익률",
          formula: "당기순이익 ÷ 매출액 × 100",
          description: "최종적으로 얼마나 돈을 벌었는지 보여주는 지표예요",
          goodRange: "5% 이상이면 좋음",
          example: "순이익률 8%면 매출 100원당 8원이 회사의 실제 수익",
        },
      ],
    },
    stability: {
      title: "안정성 지표",
      icon: Shield,
      description: "회사가 얼마나 재정적으로 안전한지 보여주는 지표예요",
      metrics: [
        {
          name: "부채비율",
          formula: "부채 총계 ÷ 자기자본 × 100",
          description: "회사가 빚을 얼마나 지고 있는지 보여주는 지표예요",
          goodRange: "100% 이하면 안정적",
          example: "부채비율 50%면 자기자본 100원당 빚이 50원이라는 뜻",
        },
        {
          name: "유동비율",
          formula: "유동자산 ÷ 유동부채 × 100",
          description: "단기 채무를 갚을 수 있는 능력을 보여주는 지표예요",
          goodRange: "200% 이상이면 안정적",
          example: "유동비율 200%면 단기 빚 100원당 현금화 가능한 자산이 200원",
        },
      ],
    },
    growth: {
      title: "성장성 지표",
      icon: ArrowUpCircle,
      description: "회사가 얼마나 성장하고 있는지 보여주는 지표예요",
      metrics: [
        {
          name: "매출액 증가율",
          formula: "(당해 매출액 - 전년 매출액) ÷ 전년 매출액 × 100",
          description: "매출이 작년보다 얼마나 늘었는지 보여주는 지표예요",
          goodRange: "업종 평균 이상이면 좋음",
          example: "증가율 20%면 작년보다 매출이 20% 늘었다는 뜻",
        },
        {
          name: "순이익 증가율",
          formula: "(당해 순이익 - 전년 순이익) ÷ 전년 순이익 × 100",
          description: "실제 벌어들이는 돈이 얼마나 늘었는지 보여주는 지표예요",
          goodRange: "매출액 증가율보다 높으면 좋음",
          example: "증가율 30%면 작년보다 순이익이 30% 늘었다는 뜻",
        },
      ],
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold">
            <value.icon className="h-5 w-5" />
            {value.title}
          </div>

          <p className="text-gray-600">{value.description}</p>

          <div className="space-y-4">
            {value.metrics.map((metric) => (
              <Card key={metric.name} className="bg-white">
                <CardContent className="pt-4">
                  <h3 className="font-bold mb-2">{metric.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">{metric.description}</p>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div>
                        <span className="font-medium">계산방법: </span>
                        <span className="text-gray-600">{metric.formula}</span>
                      </div>
                      <div>
                        <span className="font-medium">좋은 수준: </span>
                        <span className="text-gray-600">
                          {metric.goodRange}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">예시: </span>
                        <span className="text-gray-600">{metric.example}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResponsiveFinancialGuide;
