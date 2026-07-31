import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4002', 10),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_traintravel_2026_production',
};
