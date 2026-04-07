import { create } from 'zustand';

// Stub for Phase 5
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DebtState {}

export const useDebtStore = create<DebtState>(() => ({}));
