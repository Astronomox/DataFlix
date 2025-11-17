export enum UserRole {
  Admin = 'admin',
  Student = 'student'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  photourl?: string;
  birthday?: string;
  phone?: string;
}