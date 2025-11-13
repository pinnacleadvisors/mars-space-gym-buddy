export interface Visit {
  id: string;
  user_id: string;
  entry_time: string;
  exit_time?: string;
  entry_method: 'qr' | 'manual' | 'card';
  created_at: string;
}

export interface VisitWithUser extends Visit {
  user_name?: string;
  user_email?: string;
}

export interface QRCodeData {
  user_id: string;
  timestamp: string;
  action: 'entry' | 'exit';
}
