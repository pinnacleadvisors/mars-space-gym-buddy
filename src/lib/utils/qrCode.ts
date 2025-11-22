import QRCode from 'qrcode';

/**
 * QR Code data structure for gym check-in/check-out
 */
export interface QRCodeData {
  userId: string;
  timestamp: number;
  action: 'entry' | 'exit' | 'reward';
  sessionId?: string; // Optional session ID for unique QR codes
}

/**
 * Generates a QR code data object for a user
 * @param userId The user's ID
 * @param action The action type (entry or exit)
 * @param sessionId Optional session ID for unique QR codes
 * @returns QRCodeData object
 */
export const generateQRCodeData = (
  userId: string,
  action: 'entry' | 'exit',
  sessionId?: string
): QRCodeData => {
  return {
    userId,
    timestamp: Date.now(),
    action,
    sessionId,
  };
};

/**
 * Converts QR code data to a JSON string
 * @param data QRCodeData object
 * @returns JSON string
 */
export const encodeQRCodeData = (data: QRCodeData): string => {
  return JSON.stringify(data);
};

/**
 * Parses a JSON string back to QRCodeData
 * @param jsonString JSON string
 * @returns QRCodeData object or null if invalid
 */
export const decodeQRCodeData = (jsonString: string): QRCodeData | null => {
  try {
    const data = JSON.parse(jsonString);
    // Validate the data structure
    if (data.userId && data.timestamp && data.action) {
      // Allow entry, exit, or reward actions
      if (['entry', 'exit', 'reward'].includes(data.action)) {
        return data as QRCodeData;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Generates a QR code image as a data URL
 * @param data QRCodeData object or string
 * @param options QRCode options
 * @returns Promise resolving to data URL string
 */
export const generateQRCodeImage = async (
  data: QRCodeData | string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> => {
  const dataString = typeof data === 'string' ? data : encodeQRCodeData(data);
  
  const defaultOptions = {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    ...options,
  };

  try {
    const dataUrl = await QRCode.toDataURL(dataString, defaultOptions);
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generates a QR code SVG string
 * @param data QRCodeData object or string
 * @param options QRCode options
 * @returns Promise resolving to SVG string
 */
export const generateQRCodeSVG = async (
  data: QRCodeData | string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> => {
  const dataString = typeof data === 'string' ? data : encodeQRCodeData(data);
  
  const defaultOptions = {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    ...options,
  };

  try {
    const svg = await QRCode.toString(dataString, {
      type: 'svg',
      ...defaultOptions,
    });
    return svg;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
};

/**
 * Validates if a QR code data is still valid (not expired)
 * @param data QRCodeData object
 * @param maxAge Maximum age in milliseconds (default: 5 minutes)
 * @returns true if valid, false if expired
 */
export const isQRCodeValid = (data: QRCodeData, maxAge: number = 5 * 60 * 1000): boolean => {
  const age = Date.now() - data.timestamp;
  return age < maxAge;
};

