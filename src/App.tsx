/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { MainLayout } from "./components/layout/MainLayout"
import { AdminLayout } from "./components/layout/AdminLayout"
import { Home } from "./pages/Home"
import { ArticleDetail } from "./pages/ArticleDetail"
import { AdminDashboard } from "./pages/AdminDashboard"
import { AdminCreateNews } from "./pages/AdminCreateNews"
import { AdminCategories } from "./pages/AdminCategories"
import { AdminNews } from "./pages/AdminNews"
import { AdminReporters } from "./pages/AdminReporters"
import { AdminMedia } from "./pages/AdminMedia"
import { AdminComments } from "./pages/AdminComments"
import { AdminAds } from "./pages/AdminAds"
import { AdminSEO } from "./pages/AdminSEO"
import { AdminSettings } from "./pages/AdminSettings"
import { AdminAnalytics } from "./pages/AdminAnalytics"
import { CategoryPage } from "./pages/CategoryPage"
import { SearchResults } from "./pages/SearchResults"
import { UserBookmarks } from "./pages/UserBookmarks"
import { ContactUs } from "./pages/ContactUs"
import { Disclaimer, CopyrightPolicy, CorrectionsPolicy, EditorialPolicy, TermsAndConditions, PrivacyPolicy } from "./pages/LegalPages"
import { NewsProvider } from "./context/NewsContext"
import { WeatherProvider } from "./context/WeatherContext"
import { ScrollToTop } from "./components/ScrollToTop"

export default function App() {
  return (
    <ErrorBoundary>
      <WeatherProvider>
        <NewsProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="article/:slug" element={<ArticleDetail />} />
                <Route path="category/:slug" element={<CategoryPage />} />
                <Route path="search" element={<SearchResults />} />
                <Route path="bookmarks" element={<UserBookmarks />} />
                <Route path="contact" element={<ContactUs />} />
                <Route path="disclaimer" element={<Disclaimer />} />
                <Route path="copyright-policy" element={<CopyrightPolicy />} />
                <Route path="corrections-policy" element={<CorrectionsPolicy />} />
                <Route path="editorial-policy" element={<EditorialPolicy />} />
                <Route path="terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="privacy-policy" element={<PrivacyPolicy />} />
              </Route>
              
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="create" element={<AdminCreateNews />} />
                <Route path="edit/:id" element={<AdminCreateNews />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="reporters" element={<AdminReporters />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="comments" element={<AdminComments />} />
                <Route path="ads" element={<AdminAds />} />
                <Route path="seo" element={<AdminSEO />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </Router>
        </NewsProvider>
      </WeatherProvider>
    </ErrorBoundary>
  )
}

