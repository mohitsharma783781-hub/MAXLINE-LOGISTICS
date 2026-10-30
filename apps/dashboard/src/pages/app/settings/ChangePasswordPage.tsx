import React, { useState } from 'react';
import {
  Lock,
  Key,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button, Card, Alert, Input } from '../../../components/ui';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setSuccessMsg('Account password changed successfully! All active sessions updated.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const breadcrumbs = [
    { label: 'Seller Portal', path: '/app' },
    { label: 'Settings', path: '/app/settings/profile' },
    { label: 'Security & Password', path: '/app/settings/security' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <PageHeader
        title="Account Security & Password Control Center"
        description="Update your seller account login password, manage active sessions, and configure two-factor authentication (2FA)."
        breadcrumbs={breadcrumbs}
      />

      {successMsg && (
        <Alert variant="success" title="Security Update Successful">
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="danger" title="Password Error">
          {errorMsg}
        </Alert>
      )}

      {/* CHANGE PASSWORD FORM */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} style={{ color: '#2563eb' }} /> Change Account Password
          </h3>

          <Input
            label="Current Password *"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            leadingIcon={<Lock size={16} />}
            required
          />

          <Input
            label="New Password *"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leadingIcon={<Lock size={16} />}
            required
          />

          <Input
            label="Confirm New Password *"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leadingIcon={<Lock size={16} />}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ border: 'none', background: 'none', color: '#0284c7', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              {showPassword ? 'Hide Password Text' : 'Show Password Text'}
            </button>

            <Button type="submit" variant="primary" style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* 2FA ENFORCEMENT */}
      <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Two-Factor Authentication (2FA SMS / Authenticator)</strong>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Add an extra layer of protection to merchant financial payouts.</span>
        </div>
        <Button variant={twoFactorEnabled ? 'success' : 'outline'} size="sm" onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}>
          {twoFactorEnabled ? '2FA Enabled' : 'Enable 2FA Protection'}
        </Button>
      </Card>

    </div>
  );
};
