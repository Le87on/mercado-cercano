export type UserRole = "customer" | "business_owner" | "admin";

export type BusinessStatus = "pending" | "verified" | "rejected" | "suspended";

export type OrderStatus =
  | "pending_payment"
  | "payment_rejected"
  | "submitted"
  | "accepted"
  | "rejected"
  | "ready_for_pickup"
  | "in_delivery"
  | "closed"
  | "cancelled";

export type FulfillmentMode = "pickup" | "delivery";

export type SessionProfile = {
  id: string;
  fullName: string | null;
  role: UserRole;
};
