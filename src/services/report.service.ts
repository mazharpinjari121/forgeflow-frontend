import api from "./api";
import type { ApiResponse } from "@/types/api.types";

export const reportService = {
  // Get party balances report (all or filtered by partyId)
  getPartyReport: (partyId?: number) => {
    const queryString = partyId ? `?partyId=${partyId}` : "";
    return api.get<ApiResponse<any[]>>(`/report/party-report${queryString}`);
  }
};
