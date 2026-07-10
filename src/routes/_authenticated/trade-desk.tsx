import { createFileRoute }

om "@tanstack/react-router";
import {
  Target,
  Shield,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  Loader2,
  MessageSquare,
  Zap,
  X,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/shared/i18n";
import { withAlpha } from "@/shared/color-utils";
import { createTrade, listTrades } from "@/domains/trades/functions";
import type { Trade, TradeDirection } from "@/domains/trades/types";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useSound } from "@/shared/hooks/use-sound";
import { PaginationBar } from "@/components/vixor/PaginationBar";
import { CoachOverlay } from "@/components/vixor/CoachOverlay";
import { GovernorRiskPanel } from "@/components/vixor/GovernorRiskPanel";
import {
  PageLayout,
  ScrollArea,
  Badge,
  EmptyState,
  SectionTitle,
} from "@/components/vixor/PageLayout";
import { getExchangeStatus, executeTrade } from "@/domains/trading/gateway/functions";
import type { ExchangeStatus, ExecuteTradeResult } from "@/domains/trading/gateway/functions";

export const Route = createFileRoute("/_authenticated/trade-desk")({
  const queryClient = useClient();
    const [balance, setBalance] = useState("10000");
    const [riskPct, setRiskPct] = useState("1");
    const [slPips, setSlips] = useState("30");
