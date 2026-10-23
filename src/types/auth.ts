export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "pharmacist";
  roles?: string[];
  pharmacyId?: string;
  pharmacyName?: string;
  avatar?: string;
}

/** Legacy view-model retained for existing non-auth UI components. */
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
