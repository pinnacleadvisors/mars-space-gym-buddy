import { supabase } from '@/integrations/supabase/client';
import { QRCodeData } from './qrCode';

export interface ClaimRewardResult {
  success: boolean;
  error?: string;
  message?: string;
  claimed_at?: string;
}

/**
 * Claims a reward using QR code data
 * Validates the QR code and records the claim
 */
export const claimReward = async (
  qrData: QRCodeData,
  rewardType: string = 'free_drink'
): Promise<ClaimRewardResult> => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Validate QR code is for rewards
    if (qrData.action !== 'reward') {
      return {
        success: false,
        error: 'Invalid QR code type. This QR code is not for rewards.'
      };
    }

    // Validate QR code belongs to current user
    if (qrData.userId !== user.id) {
      return {
        success: false,
        error: 'This QR code does not belong to you.'
      };
    }

    // Call the database function to claim the reward
    const { data, error } = await supabase.rpc('claim_reward', {
      _user_id: user.id,
      _qr_timestamp: qrData.timestamp,
      _qr_session_id: qrData.sessionId || '',
      _reward_type: rewardType
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to claim reward'
      };
    }

    // Parse the result
    if (data && data.success) {
      return {
        success: true,
        message: data.message || 'Reward claimed successfully!',
        claimed_at: data.claimed_at
      };
    } else {
      return {
        success: false,
        error: data?.error || 'Failed to claim reward'
      };
    }
  } catch (error: any) {
    console.error('Error claiming reward:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

