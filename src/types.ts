export interface Certificate {
  id: string;
  certificateId: string;
  name: string; // Contact Person
  companyName?: string;
  course: string; // Address
  formType: 'Form A' | 'Form B' | 'Form C';
  issueDate: string;
  expiryDate: string;
  status: 'Active' | 'Inactive';
  issuedBy?: string;
  pdfPath?: string;
  createdAt: string;
}
