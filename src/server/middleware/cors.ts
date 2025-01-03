import cors from 'cors';
import { CLIENT_URL } from '../../lib/config/constants';

export const corsMiddleware = cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
});