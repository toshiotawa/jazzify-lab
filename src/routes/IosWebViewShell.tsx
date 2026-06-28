import React from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { getIOSMode, getIOSParam, isIOSWebView } from '@/utils/iosbridge';

const LazyFantasyMain = React.lazy(() => import('@/components/fantasy/FantasyMain'));
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
const LazyLessonDetailPage = React.lazy(() => import('@/components/lesson/LessonDetailPage'));

const IosWebViewShell: React.FC = () => {
  if (!isIOSWebView()) {
    return null;
  }

  const resolveHashRoute = (): React.ReactNode => {
    const hashBase = window.location.hash.split('?')[0].replace('#', '');
    switch (hashBase) {
      case 'survival-lesson':
        return <LazySurvivalMain lessonMode />;
      case 'survival-tutorial-lesson':
        return <LazySurvivalTutorialMain />;
      case 'balloon-rush-lesson':
        return (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazyBalloonRushMain />
          </React.Suspense>
        );
      case 'ear-training-lesson':
        return <LazyEarTrainingMain />;
      case 'ear-training-tutorial-lesson':
        return <LazyEarTrainingTutorialMain />;
      case 'fantasy':
        return <LazyFantasyMain />;
      case 'play-lesson':
      case 'play-mission':
        return <LazyGameScreen />;
      case 'survival':
        return <LazySurvivalMain />;
      default:
        return <LazyGameScreen />;
    }
  };

  const iosMode = getIOSMode();
  const effectiveMode = iosMode ?? 'web-page';
  let iosContent: React.ReactNode;

  switch (effectiveMode) {
    case 'demo-lp':
      iosContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalMain demoMode />
        </React.Suspense>
      );
      break;
    case 'fantasy': {
      const stageParam = getIOSParam('stage');
      iosContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyFantasyMain initialStage={stageParam ?? undefined} />
        </React.Suspense>
      );
      break;
    }
    case 'survival':
      iosContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalMain />
        </React.Suspense>
      );
      break;
    case 'play-lesson':
    case 'ear-training-lesson':
      iosContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          {effectiveMode === 'ear-training-lesson' ? <LazyEarTrainingMain /> : <LazyGameScreen />}
        </React.Suspense>
      );
      break;
    case 'lesson-detail':
      iosContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyLessonDetailPage />
        </React.Suspense>
      );
      break;
    case 'web-page':
      iosContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          {resolveHashRoute()}
        </React.Suspense>
      );
      break;
    case 'songs':
    case 'practice':
      iosContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyGameScreen />
        </React.Suspense>
      );
      break;
    default:
      iosContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyGameScreen />
        </React.Suspense>
      );
      break;
  }

  return (
    <ErrorBoundary>
      <div className="game-container relative w-full h-screen overflow-hidden bg-gradient-game text-white font-sans antialiased">
        {iosContent}
      </div>
    </ErrorBoundary>
  );
};

export default IosWebViewShell;
