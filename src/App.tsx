/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route } from 'react-router-dom';
import { UserPortal } from './pages/UserPortal';
import { AdminPortal } from './pages/AdminPortal';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<UserPortal />} />
        <Route path="/id" element={<UserPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </HashRouter>
  );
}
