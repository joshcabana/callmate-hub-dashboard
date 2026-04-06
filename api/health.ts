import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only expose safe, non-sensitive health status
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
