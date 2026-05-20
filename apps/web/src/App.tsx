import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './routes/landing';
import { LoginPage } from './routes/login';
import { SignupPage } from './routes/signup';
import { PaywallPage } from './routes/paywall';
import { HomePage } from './routes/home';
import { HeroVideoPage } from './routes/hero-video';
import { TrendlinePage } from './routes/trendline';
import { XFarmPage } from './routes/xfarm';
import { AdminPage } from './routes/admin';
import { AppShell } from './ui/app-shell';
import { ProtectedRoute } from './ui/protected-route';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="pay" element={<PaywallPage />} />
        <Route path="hero-video" element={<HeroVideoPage />} />
        <Route path="trendline" element={<TrendlinePage />} />
        <Route path="xfarm" element={<XFarmPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
