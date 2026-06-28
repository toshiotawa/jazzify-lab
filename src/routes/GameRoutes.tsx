import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { dashboardPath } from '@/utils/appNavigation';

const LazyFantasyMain = React.lazy(() => import('@/components/fantasy/FantasyMain'));
const LazyStoryPage = React.lazy(() => import('@/components/fantasy/StoryPage'));
const LazySurvivalMain = React.lazy(() => import('@/components/survival/SurvivalMain'));
const LazySurvivalTutorialMain = React.lazy(
  () => import('@/components/survival/tutorial/SurvivalTutorialMain'),
);
const LazyGameScreen = React.lazy(() => import('@/components/game/GameScreen'));
const LazyEarTrainingMain = React.lazy(() => import('@/components/earTraining/EarTrainingMain'));
const LazyEarTrainingTutorialMain = React.lazy(
  () => import('@/components/earTraining/tutorial/EarTrainingTutorialMain'),
);
const LazyBalloonRushMain = React.lazy(() => import('@/components/balloonRush/BalloonRushMain'));

interface GameRoutesProps {
  isPremiumMember: boolean;
  renderDashboard: () => React.ReactNode;
}

const GameRoutes: React.FC<GameRoutesProps> = ({ isPremiumMember, renderDashboard }) => (
  <Routes>
    <Route
      path="fantasy"
      element={
        !isPremiumMember ? (
          <Navigate to={dashboardPath()} replace />
        ) : (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazyFantasyMain />
          </React.Suspense>
        )
      }
    />
    <Route
      path="story"
      element={
        !isPremiumMember ? (
          <Navigate to={dashboardPath()} replace />
        ) : (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazyStoryPage />
          </React.Suspense>
        )
      }
    />
    <Route
      path="survival"
      element={
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalMain />
        </React.Suspense>
      }
    />
    <Route
      path="survival-lesson"
      element={
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalMain lessonMode />
        </React.Suspense>
      }
    />
    <Route
      path="survival-tutorial"
      element={
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalTutorialMain />
        </React.Suspense>
      }
    />
    <Route
      path="balloon-rush"
      element={
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyBalloonRushMain />
        </React.Suspense>
      }
    />
    <Route
      path="ear-training"
      element={
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyEarTrainingMain />
        </React.Suspense>
      }
    />
    <Route
      path="ear-training-tutorial"
      element={
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyEarTrainingTutorialMain />
        </React.Suspense>
      }
    />
    <Route
      path="lesson"
      element={
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyGameScreen />
        </React.Suspense>
      }
    />
    <Route path="*" element={renderDashboard()} />
  </Routes>
);

export default GameRoutes;
