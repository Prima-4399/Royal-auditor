import React from "react";
import {
  Search,
  FileText,
  AlertTriangle,
  BarChart3,
  Zap,
  TrendingDown,
  ClipboardList,
} from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: "search" | "audit" | "compliance" | "leakage" | "data" | "results" | "violations";
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

const iconMap = {
  search: Search,
  audit: ClipboardList,
  compliance: AlertTriangle,
  leakage: TrendingDown,
  data: FileText,
  results: BarChart3,
  violations: Zap,
};

export function EmptyState({
  icon = "search",
  title,
  description,
  actionText,
  onAction,
  isLoading = false,
}: EmptyStateProps) {
  const IconComponent = iconMap[icon] || Search;

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-md gap-4">
        <div className="p-3 bg-rg-bg-secondary rounded-lg">
          <IconComponent className="w-8 h-8 text-rg-gold" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-rg-text-primary mb-2">
            {title}
          </h3>
          <p className="text-sm text-rg-text-muted leading-relaxed">
            {description}
          </p>
        </div>

        {actionText && onAction && (
          <Button
            onClick={onAction}
            disabled={isLoading}
            className="mt-2"
            variant="default"
          >
            {isLoading ? "Loading..." : actionText}
          </Button>
        )}
      </div>
    </div>
  );
}
