"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const CompanyAnalysis = () => {
  const [showDetails, setShowDetails] = useState(false);

  // 예시 데이터
  const analysis = {
    status: {
      overall: "양호",
      emoji: "🙂",
      level: 4, // 1-5
      stability: "안정",
      growth: "성장중",
    },
    summary:
      "매출과 순이익이 꾸준히 증가하고 있으며, 부채비율도 낮은 안정적인 회사입니다.",
    details: {
      stability: {
        status: "안정적",
        description: "부채비율 40% 미만으로 재무구조가 탄탄합니다.",
        icon: Shield,
      },
      growth: {
        status: "성장중",
        description: "전년 대비 매출 15% 증가, 영업이익 10% 증가했습니다.",
        icon: TrendingUp,
      },
      risk: {
        status: "낮음",
        description: "현금성 자산이 풍부하고 유동비율이 200% 이상입니다.",
        icon: TrendingDown,
      },
    },
  };

  // 상태 레벨에 따른 배경색 결정
  const getStatusColor = (level) => {
    const colors = {
      1: "bg-red-100",
      2: "bg-orange-100",
      3: "bg-yellow-100",
      4: "bg-green-100",
      5: "bg-blue-100",
    };
    return colors[level] || "bg-gray-100";
  };

  const getStatusText = (level) => {
    const status = {
      1: "매우위험",
      2: "주의",
      3: "보통",
      4: "양호",
      5: "매우좋음",
    };
    return status[level] || "평가중";
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card
        className={`${getStatusColor(
          analysis.status.level
        )} transition-all duration-300`}
      >
        <CardContent className="pt-6">
          {/* 상단 상태 표시 */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{analysis.status.emoji}</div>
            <div className="text-2xl font-bold mb-2">
              회사의 상태: {getStatusText(analysis.status.level)}
            </div>
            <div className="text-gray-600">{analysis.summary}</div>
          </div>

          {/* 상세정보 토글 버튼 */}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" /> 간단히 보기
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" /> 자세히 보기
              </>
            )}
          </Button>

          {/* 상세 분석 정보 */}
          {showDetails && (
            <div className="mt-6 space-y-4">
              {Object.entries(analysis.details).map(([key, value]) => (
                <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <value.icon className="h-5 w-5" />
                    <span className="font-semibold capitalize">{key}:</span>
                    <span>{value.status}</span>
                  </div>
                  <p className="text-gray-600 text-sm ml-7">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyAnalysis;
