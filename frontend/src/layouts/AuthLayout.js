import React from 'react';
import { Outlet } from 'react-router-dom';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

function AuthLayout() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 1000 }}>
        <LanguageSwitcher />
      </div>
      <Outlet />
    </div>
  );
}

export default AuthLayout;
