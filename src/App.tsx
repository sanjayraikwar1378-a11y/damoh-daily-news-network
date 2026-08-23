/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { MainLayout } from "./components/layout/MainLayout"
import { Home } from "./pages/Home"
import { NewsProvider } from "./context/NewsContext"
import { WeatherProvider } from "./context/WeatherContext"
import { ScrollToTop } from "./components/ScrollToTop"

// Lazy-loaded Admin Layout
const AdminLayout = lazy(() => import("./components/layout/AdminLayout").then(m => ({ default: m.AdminLayout })))

// Lazy-loaded pages for code splitting & bundle optimization
const ArticleDetail = lazy(() => import("./pages/ArticleDetail").then(m => ({ default: m.ArticleDetail })))
const LatestNewsPage = lazy(() => import("./pages/LatestNewsPage").then(m => ({ default: m.LatestNewsPage })))
const CategoryPage = lazy(() => import("./pages/CategoryPage").then(m => ({ default: m.CategoryPage })))
const SearchResults = lazy(() => import("./pages/SearchResults").then(m => ({ default: m.SearchResults })))
const UserBookmarks = lazy(() => import("./pages/UserBookmarks").then(m => ({ default: m.UserBookmarks })))
const ContactUs = lazy(() => import("./pages/ContactUs").then(m => ({ default: m.ContactUs })))
const AboutUs = lazy(() => import("./pages/AboutUs").then(m => ({ default: m.AboutUs })))

// Legal Pages
const Disclaimer = lazy(() => import("./pages/LegalPages").then(m => ({ default: m.Disclaimer })))
const CopyrightPolicy = lazy(() => import("./pages/LegalPages").then(m => ({ default: m.CopyrightPolicy })))
const CorrectionsPolicy = lazy(() => import("./pages/LegalPages").then(m => ({ default: m.CorrectionsPolicy })))
const EditorialPolicy = lazy(() => import("./pages/LegalPages").then(m => ({ default: m.EditorialPolicy })))
const TermsAndConditions = lazy(() => import("./pages/LegalPages").then(m => ({ default: m.TermsAndConditions })))
const PrivacyPolicy = lazy(() => import("./pages/LegalPages").then(m => ({ default: m.PrivacyPolicy })))

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })))
const AdminCreateNews = lazy(() => import("./pages/AdminCreateNews").then(m => ({ default: m.AdminCreateNews })))
const AdminCategories = lazy(() => import("./pages/AdminCategories").then(m => ({ default: m.AdminCategories })))
const AdminNews = lazy(() => import("./pages/AdminNews").then(m => ({ default: m.AdminNews })))
const AdminReporters = lazy(() => import("./pages/AdminReporters").then(m => ({ default: m.AdminReporters })))
const AdminMedia = lazy(() => import("./pages/AdminMedia").then(m => ({ default: m.AdminMedia })))
const AdminComments = lazy(() => import("./pages/AdminComments").then(m => ({ default: m.AdminComments })))
const AdminAds = lazy(() => import("./pages/AdminAds").then(m => ({ default: m.AdminAds })))
const AdminSEO = lazy(() => import("./pages/AdminSEO").then(m => ({ default: m.AdminSEO })))
const AdminSettings = lazy(() => import("./pages/AdminSettings").then(m => ({ default: m.AdminSettings })))
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics").then(m => ({ default: m.AdminAnalytics })))
const AdminMessages = lazy(() => import("./pages/AdminMessages").then(m => ({ default: m.AdminMessages })))

function PageLoader() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl space-y-6 animate-pulse">
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
      <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
      <div className="space-y-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <WeatherProvider>
        <NewsProvider>
          <Router>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="latest-news" element={<LatestNewsPage />} />
                  <Route path="article/:slug" element={<ArticleDetail />} />
                  <Route path="category/:slug" element={<CategoryPage />} />
                  <Route path="search" element={<SearchResults />} />
                  <Route path="bookmarks" element={<UserBookmarks />} />
                  <Route path="contact" element={<ContactUs />} />
                  <Route path="contact-us" element={<ContactUs />} />
                  <Route path="send-news-tip" element={<ContactUs />} />
                  <Route path="send-tip" element={<ContactUs />} />
                  <Route path="news-tip" element={<ContactUs />} />
                  <Route path="news-tips" element={<ContactUs />} />
                  <Route path="submit-news" element={<ContactUs />} />
                  <Route path="feedback" element={<ContactUs />} />
                  <Route path="about" element={<AboutUs />} />
                  <Route path="about-us" element={<AboutUs />} />
                  <Route path="disclaimer" element={<Disclaimer />} />
                  <Route path="copyright-policy" element={<CopyrightPolicy />} />
                  <Route path="corrections-policy" element={<CorrectionsPolicy />} />
                  <Route path="editorial-policy" element={<EditorialPolicy />} />
                  <Route path="terms-and-conditions" element={<TermsAndConditions />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="*" element={<Home />} />
                </Route>
                
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="messages" element={<AdminMessages />} />
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
            </Suspense>
          </Router>
        </NewsProvider>
      </WeatherProvider>
    </ErrorBoundary>
  )
}

