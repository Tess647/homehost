import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SWRConfig } from 'swr';

// Lazy loaded auth components
const Login = lazy(() => import('./Auth/Login'));
const Register = lazy(() => import('./Auth/Register'));
const Profile = lazy(() => import('./Auth/Profile'));

// Import protected route components
import { ProtectedRoute, PublicOnlyRoute } from '../routes/ProtectedRoute';
import LoadingSpinner from './LoadingSpinner';

// Regular imports
import Admin from './Admin';
import AlbumDetail from './AlbumDetail/AlbumDetail';
import Albums from './Albums/Albums';
import Artists from './Artists/Artists';
import Movies from './Movies';
import Music from './Music';
import MusicHome from './MusicHome/MusicHome';
import MusicSearch from './MusicSearch';
import NotFound from './NotFound';
import Songs from './Songs/Songs';
import TVShows from './TVShows';

const App = () => {
  return (
    <React.Fragment>
      <SWRConfig
        value={{
          fetcher: (resource, init) =>
            fetch(
              `${process.env.REACT_APP_HOMEHOST_BASE}/api` + resource,
              init
            ).then((res) => res.json()),
        }}
      >
        <BrowserRouter basename={process.env.PUBLIC_URL}>
          <Routes>
            {/* Public Routes */}
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<TVShows />} />
            
            {/* Music Routes */}
            <Route path="music" element={<Music />}>
              <Route index element={<MusicHome />} />
              <Route path="search" element={<MusicSearch />} />
              <Route path="search/:id" element={<MusicSearch />} />
              <Route path="albums" element={<Albums />} />
              <Route path="album/:id" element={<AlbumDetail />} />
              <Route path="artists" element={<Artists />} />
              <Route path="songs" element={<Songs />} />
            </Route>
            
            {/* Authentication Routes */}
            <Route path="/login" element={
              <PublicOnlyRoute redirectTo="/profile">
                <Suspense fallback={<LoadingSpinner />}>
                  <Login />
                </Suspense>
              </PublicOnlyRoute>
            } />
            
            <Route path="/register" element={
              <PublicOnlyRoute redirectTo="/profile">
                <Suspense fallback={<LoadingSpinner />}>
                  <Register />
                </Suspense>
              </PublicOnlyRoute>
            } />
            
            {/* Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SWRConfig>
    </React.Fragment>
  );
};

export default App;