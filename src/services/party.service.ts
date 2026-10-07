import api from "./api";
import type { ApiResponse, PartyRecord, AddPartyRequest, UpdatePartyRequest } from "@/types/api.types";

export const partyService = {

  // Get all parties with optional type and status query params
  getAllParties: (type?: string, status?: string) => {
    let params = [];
    if (type) params.push(`type=${encodeURIComponent(type)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    const queryString = params.length ? `?${params.join('&')}` : '';
    return api.get<ApiResponse<PartyRecord[]>>(`/party/all${queryString}`);
  },

  // Get party by ID
  getPartyById: (id: number) => api.get<ApiResponse<PartyRecord>>(`/party/${id}`),

  // Get party summary (outstanding dues, active bookings, last payment)
  getPartySummary: (id: number) => api.get<ApiResponse<any>>(`/party/partysummery/${id}`),

  // Add new party
  addParty: (data: AddPartyRequest) => api.post<ApiResponse<any>>('/party/add', data),

  // Update existing party
  updateParty: (data: UpdatePartyRequest) => api.post<ApiResponse<any>>('/party/update', data),

  // Delete party
  deleteParty: (id: number, userId: number) => api.post<ApiResponse<any>>(`/party/delete/${id}/${userId}`),
};
