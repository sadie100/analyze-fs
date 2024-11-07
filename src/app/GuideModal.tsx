import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import ResponsiveFinancialGuide from "./ResponsiveFinancialGuide";

const GuideModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          도움말
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] lg:max-w-[85vw] bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl">재무제표 쉽게 이해하기</DialogTitle>
        </DialogHeader>
        <ResponsiveFinancialGuide />
      </DialogContent>
    </Dialog>
  );
};

export default GuideModal;
