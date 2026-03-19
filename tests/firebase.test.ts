import { describe, it, expect } from 'vitest';

describe('Firebase Configuration', () => {
  it('should have all required Firebase environment variables', () => {
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ];

    requiredVars.forEach((varName) => {
      const value = process.env[varName];
      expect(value).toBeDefined();
      expect(value).not.toBe('');
      expect(typeof value).toBe('string');
    });
  });

  it('should have valid Firebase API Key format', () => {
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    expect(apiKey).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(apiKey?.length).toBeGreaterThan(20);
  });

  it('should have valid Firebase Project ID', () => {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    expect(projectId).toBe('sorteador-pazetto');
  });

  it('should have valid Firebase Auth Domain', () => {
    const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
    expect(authDomain).toMatch(/\.firebaseapp\.com$/);
  });
});
