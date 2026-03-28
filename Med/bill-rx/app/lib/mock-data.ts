import { v4 as uuidv4 } from 'uuid';

export const MOCK_PATIENTS = [
    { id: '1', name: 'Sarah Johnson', dob: '1985-04-12', insurance: 'BlueCross BlueShield', policy: 'BC-998231', lastVisit: '2025-01-15' },
    { id: '2', name: 'Michael Chen', dob: '1979-08-23', insurance: 'Aetna', policy: 'AE-112004', lastVisit: '2024-12-20' },
    { id: '3', name: 'Emily Davis', dob: '1992-11-05', insurance: 'UnitedHealthcare', policy: 'UH-554211', lastVisit: '2025-01-10' },
    { id: '4', name: 'Robert Wilson', dob: '1965-02-14', insurance: 'Medicare', policy: 'MC-2231-A', lastVisit: '2025-01-05' },
    { id: '5', name: 'Jessica Taylor', dob: '1998-07-30', insurance: 'Cigna', policy: 'CG-888992', lastVisit: '2024-11-15' },
];

export const MOCK_CLAIMS = [
    { id: 'C-1001', date: '2025-01-15', provider: 'General Hospital', amount: 3500.00, status: 'Reviewing', issues: 2 },
    { id: 'C-0922', date: '2024-12-20', provider: 'City Clinic', amount: 150.00, status: 'Approved', issues: 0 },
    { id: 'C-0841', date: '2024-11-15', provider: 'Northwest ER', amount: 12500.00, status: 'Disputed', issues: 5 },
    { id: 'C-0750', date: '2024-10-01', provider: 'Quest Diagnostics', amount: 450.00, status: 'Paid', issues: 0 },
    { id: 'C-0621', date: '2024-09-12', provider: 'Valley Imaging', amount: 1200.00, status: 'Saved', issues: 1 },
];
