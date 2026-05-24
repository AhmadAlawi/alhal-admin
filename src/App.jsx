import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { NotificationProvider } from './contexts/NotificationContext'
import { AccessProvider } from './contexts/AccessContext'
import GuardedPage from './components/GuardedPage/GuardedPage'
import { PERMISSIONS } from './utils/accessControl'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import ReportBuilder from './pages/ReportBuilder'
import SavedReports from './pages/SavedReports'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Orders from './pages/Orders'
import Settings from './pages/Settings'
import ChatReports from './pages/ChatReports'
import Tickets from './pages/Tickets'
import Feedback from './pages/Feedback'
import TransportProviders from './pages/TransportProviders'
import TransportRequests from './pages/TransportRequests'
import TransportPriceLines from './pages/TransportPriceLines'
import TransportVehicles from './pages/TransportVehicles'
import Ads from './pages/Ads'
import MobileAnalytics from './pages/MobileAnalytics'
import GovPlaceholder from './pages/GovPlaceholder'
import RbacLayout from './pages/rbac/RbacLayout'
import RbacPermissions from './pages/rbac/RbacPermissions'
import RbacRoles from './pages/rbac/RbacRoles'
import RbacUserAccess from './pages/rbac/RbacUserAccess'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import './App.css'

function App() {
  return (
    <NotificationProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AccessProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <GuardedPage permission={PERMISSIONS.GOV_DASHBOARD}>
                  <Dashboard />
                </GuardedPage>
              }
            />
            <Route
              path="/reports/saved"
              element={
                <GuardedPage permission={PERMISSIONS.GOV_REPORTS_BUILD}>
                  <SavedReports />
                </GuardedPage>
              }
            />
            <Route
              path="/reports/builder"
              element={
                <GuardedPage permission={PERMISSIONS.GOV_REPORTS_BUILD}>
                  <ReportBuilder />
                </GuardedPage>
              }
            />
            <Route
              path="/reports"
              element={
                <GuardedPage permission={PERMISSIONS.GOV_REPORTS}>
                  <Reports />
                </GuardedPage>
              }
            />
            <Route
              path="/analytics"
              element={
                <GuardedPage permission={PERMISSIONS.GOV_MARKET_ANALYSIS}>
                  <Analytics />
                </GuardedPage>
              }
            />
            <Route
              path="/gov/alerts"
              element={
                <GuardedPage permission={PERMISSIONS.GOV_ALERTS}>
                  <GovPlaceholder titleKey="nav.marketAlerts" />
                </GuardedPage>
              }
            />
            <Route
              path="/gov/market-control"
              element={
                <GuardedPage permission={PERMISSIONS.GOV_MARKET_CONTROL}>
                  <GovPlaceholder titleKey="nav.marketControl" />
                </GuardedPage>
              }
            />
            <Route
              path="/products"
              element={
                <GuardedPage permission={PERMISSIONS.GOV_PRODUCT_PRICES}>
                  <Products />
                </GuardedPage>
              }
            />
            <Route
              path="/transport/price-lines"
              element={
                <GuardedPage permission={PERMISSIONS.GOV_TRANSPORT_PRICES}>
                  <TransportPriceLines />
                </GuardedPage>
              }
            />

            <Route
              path="/rbac"
              element={
                <GuardedPage rbacAdmin>
                  <RbacLayout />
                </GuardedPage>
              }
            >
              <Route index element={<Navigate to="permissions" replace />} />
              <Route path="permissions" element={<RbacPermissions />} />
              <Route path="roles" element={<RbacRoles />} />
              <Route path="users" element={<RbacUserAccess />} />
            </Route>

            <Route
              path="/users"
              element={
                <GuardedPage legacyAdmin>
                  <Users />
                </GuardedPage>
              }
            />
            <Route
              path="/categories"
              element={
                <GuardedPage legacyAdmin>
                  <Categories />
                </GuardedPage>
              }
            />
            <Route
              path="/orders"
              element={
                <GuardedPage legacyAdmin>
                  <Orders />
                </GuardedPage>
              }
            />
            <Route
              path="/chat-reports"
              element={
                <GuardedPage legacyAdmin>
                  <ChatReports />
                </GuardedPage>
              }
            />
            <Route
              path="/tickets"
              element={
                <GuardedPage legacyAdmin>
                  <Tickets />
                </GuardedPage>
              }
            />
            <Route
              path="/feedback"
              element={
                <GuardedPage legacyAdmin>
                  <Feedback />
                </GuardedPage>
              }
            />
            <Route
              path="/transport/providers"
              element={
                <GuardedPage legacyAdmin>
                  <TransportProviders />
                </GuardedPage>
              }
            />
            <Route
              path="/transport/vehicles"
              element={
                <GuardedPage legacyAdmin>
                  <TransportVehicles />
                </GuardedPage>
              }
            />
            <Route
              path="/transport/requests"
              element={
                <GuardedPage legacyAdmin>
                  <TransportRequests />
                </GuardedPage>
              }
            />
            <Route
              path="/ads"
              element={
                <GuardedPage legacyAdmin>
                  <Ads />
                </GuardedPage>
              }
            />
            <Route
              path="/mobile-analytics"
              element={
                <GuardedPage legacyAdmin>
                  <MobileAnalytics />
                </GuardedPage>
              }
            />
            <Route
              path="/settings"
              element={
                <GuardedPage legacyAdmin>
                  <Settings />
                </GuardedPage>
              }
            />

            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AccessProvider>
      </Router>
    </NotificationProvider>
  )
}

export default App
