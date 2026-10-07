export interface ApiMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  responseStatus: "Success" | "Error";
  message: string;
  errorCode?: string;
  data?: T;
}

// Auth Types
export interface AuthLoginRequest {
  userName: string;
  password: string;
}

export interface LoginUserData {
  userId: number;
  fullName: string;
  mobileNo: string;
  emailID: string;
  role: string;
  status: string;
  userName: string;
}

export interface AuthLoginResponse extends ApiResponse<LoginUserData> { }

export interface ResetPasswordRequest {
  userId: number;
  password: string;
}

export interface ResetPasswordResponse {
  responseStatus: "Success" | "Error";
  message: string;
}

// Category Types
export interface CategoryRecord {
  categoryId: number;
  categoryName: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AddCategoryRequest {
  categoryName: string;
  createdBy: number;
}

export interface UpdateCategoryRequest {
  categoryId: number;
  categoryName: string;
  updatedBy: number;
}

// Product Types
export interface ProductRecord {
  productId: number;
  productName: string;
  categoryId: number;
  categoryName: string;
  price: number;
  specification: string;
  description?: string;
  discription?: string;
  minimumStockAlert: number;
  isBroadcast: boolean;
  status: string;
  hsncode?: string;
  hsnCode?: string;
  igst?: number;
  cgst: number;
  sgst?: number;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AddProductRequest {
  productName: string;
  categoryId: number;
  price: number;
  specification: string;
  discription: string;
  minimumStockAlert: number;
  isBroadcast: boolean;
  status: string;
  hsnCode: string;
  cgst: number;
  sgst: number;
  createdBy: number;
}

export interface UpdateProductRequest {
  productId: number;
  productName: string;
  categoryId: number;
  price: number;
  specification: string;
  discription: string;
  minimumStockAlert: number;
  isBroadcast: boolean;
  status: string;
  hsnCode: string;
  cgst: number;
  sgst: number;
  updatedBy: number;
}

// Product Gallery Types
export interface ProductGalleryRecord {
  galleryId: number;
  productId: number;
  productName: string;
  type: string;
  name: string;
  fileUrl: string;
  isActive: boolean;
}

// Existing types preserved for backward compatibility
export interface AuthLoginUser {
  userID: number;
  email: string;
  mobileNumber: string;
  alternateNumber: string | null;
  twoFactAuth: boolean;
  fullName: string;
  fatherName: string | null;
  dob: string;
  gender: string;
  maritalStatus: string | null;
  bloodGroup: string | null;
  permanentAddress: string | null;
  currentAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  isEmployee: boolean;
  roleID?: number;
  roleName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthAssignmentPermission {
  permissionID: number;
  permissionType: "SIDEBAR" | "REQUEST" | "ACTION";
  permissionName: string;
  isActive: boolean;
}

export interface AuthAssignment {
  employeeAssignmentID?: number;
  employeeDepartmentAssignmentID?: number;
  employeeID?: number;
  departmentID: number | null;
  departmentName: string;
  roleID?: number;
  roleName?: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive?: boolean;
  permissions: AuthAssignmentPermission[];
}

export interface AuthLoginData {
  token: string;
  refreshToken: string;
  user: AuthLoginUser;
  assignments?: AuthAssignment[];
  assignDepartments?: AuthAssignment[];
  expiresAt: string;
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface EmployeeRecord {
  employeeID?: string;
  userID?: number;
  fullName?: string;
  email?: string;
  employeeCode?: string;
  reportingManagerID?: number;
  reportingManagerName?: string;
  employeeTypeID?: number;
  employeeTypeName?: string;
  employmentStatus?: string;
  dateOfJoining?: string;
  dateOfExit?: string | null;
  isZimmedaran?: boolean;
  isActive?: boolean;
  currentDepartmentID?: number;
  currentDepartmentName?: string;
  currentRoleID?: number;
  currentRoleName?: string;
  gender?: string;
  dob?: string;
  mobileNumber?: string;
  alternateNumber?: string | null;
  bloodGroup?: string;
  maritalStatus?: string | null;
  fatherName?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeCreateRequest {
  userID: number;
  employeeCode: string;
  reportingManagerID: number;
  employeeTypeID: number;
  employmentStatus: string;
  dateOfJoining: string;
  isZimmedaran: boolean;
  password?: string;
  createdBy: number;
  departmentID: number;
  roleID: number;
}

export type EmployeeUpdateRequest = Partial<EmployeeCreateRequest>;

export interface UserRecord {
  userId: number;
  userName: string;
  fullName?: string;
  email: string;
  emailID?: string;
  mobileNo: string;
  role: string;
  status: string;
  isActive: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserRequest {
  userName: string;
  fullName?: string;
  email: string;
  emailID?: string;
  mobileNo: string;
  password?: string;
  role: string;
  createdBy: number;
}

export interface UserUpdateRequest {
  userId: number;
  userName: string;
  fullName?: string;
  email: string;
  emailID?: string;
  mobileNo: string;
  password?: string;
  role: string;
  updatedBy: number;
}

// Party Types
export interface PartyRecord {
  partyId: number;
  partyName: string;
  partyType: string;
  contactPerson: string;
  primaryMobile: string;
  whatsAppMobile: string; // Updated to match actual API response
  email: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: number;
  status: string;
  remark: string;
  gstin: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updateAt: string; // Updated to match actual API response
  isActive: boolean;
}

export interface AddPartyRequest {
  partyName: string;
  partyType: string;
  contactPerson: string;
  primaryMobile: string;
  whatsAppMobile: string; // Updated to match actual API request
  email: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: number;
  status: string;
  remark: string;
  gstin: string;
  createdBy: number;
}

export interface UpdatePartyRequest {
  partyId: number;
  partyName: string;
  partyType: string;
  contactPerson: string;
  primaryMobile: string;
  whatsAppMobile: string; // Updated to match actual API request
  email: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: number;
  status: string;
  remark: string;
  gstin: string;
  updatedBy: number;
}

// Order Types
export interface OrderDetailRequest {
  productId: number;
  qty: number;
  rate: number;
  amount: number;
  userId: number;
}

export interface OrderDetailRecord {
  orderDetailId: number;
  orderId: number;
  productId: number;
  productName: string;
  qty: number;
  rate: number;
  amount: number;
  isActive: boolean;
}

export interface AddOrderRequest {
  orderId: number;
  partyId: number;
  orderType: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: string;
  remark: string;
  userId: number;
  orderDetails: OrderDetailRequest[];
}

export interface OrderRecord {
  orderId: number;
  partyId: number;
  partyName: string;
  partyType: string;
  contactPerson: string;
  primaryMobile: string;
  whatsappMobile: string;
  orderType: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: string;
  remark: string;
  totalAmount: number;
  deliveredPercentage?: number;
  isActive: boolean;
  orderDetails: OrderDetailRecord[];
}

export interface UpdateOrderStatusRequest {
  orderId: number;
  userId: number;
  status: string;
}

// Order Return Types
export interface OrderReturnDetailRequest {
  productId: number;
  qty: number;
  amount: number;
  userId: number;
}

export interface OrderReturnDetailUpdateRequest {
  returnDetailId: number;
  returnId: number;
  productId: number;
  qty: number;
  amount: number;
  userId: number;
}

export interface AddOrderReturnRequest {
  returnDate: string;
  orderId: number;
  reason: string;
  userId: number;
  orderReturnDetails: OrderReturnDetailRequest[];
}

export interface UpdateOrderReturnRequest {
  returnId: number;
  returnDate: string;
  orderId: number;
  reason: string;
  userId: number;
  orderReturnDetails: OrderReturnDetailUpdateRequest[];
}

export interface OrderReturnDetailRecord {
  returnDetailId: number;
  returnId: number;
  productId: number;
  productName?: string;
  qty: number;
  rate?: number;
  amount: number;
  isActive: boolean;
}

export interface OrderReturnRecord {
  returnId: number;
  returnDate: string;
  orderId: number;
  totalAmount: number;
  partyId: number;
  partyName: string;
  reason: string;
  totalAmount1: number;
  isActive: boolean;
  orderReturnDetails: OrderReturnDetailRecord[];
}



