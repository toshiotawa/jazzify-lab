import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import App from './App';

vi.mock('@/app-extra.css', () => ({}));
vi.mock('@/hooks/useGaPageViews', () => ({ useGaPageViews: () => {} }));
vi.mock('@/hooks/useAppStylesheets', () => ({ useAppStylesheets: () => {} }));
vi.mock('@/routes/appAuthBootstrap', () => ({ bootstrapAppAuth: async () => {}, prefetchProtectedAppRoute: () => {} }));
vi.mock('@/components/ui/ToastContainer', () => ({ default: () => null }));
vi.mock('@/components/ui/LoadingScreen', () => ({ default: () => <span>loading</span> }));
vi.mock('@/components/ui/EnvironmentBadge', () => ({ EnvironmentBadge: () => null }));
vi.mock('@/routes/appRouteLoader', async () => {
  const { useNavigate } = await import('react-router-dom');
  const Component = () => {
    const navigate = useNavigate();
    return <button onClick={() => navigate('/main/play/fantasy?lessonId=123#run')}>play</button>;
  };
  return { getPreloadedRouteModule: () => ({ default: Component }), loadRouteModule: async () => ({ default: Component }) };
});

afterEach(() => vi.unstubAllGlobals());
it.each(['/main/dashboard', '/login', '/main/play/training'])('reloads only across the game document boundary from %s', (pathname) => {
  const replace = vi.fn();
  vi.stubGlobal('window', Object.assign(Object.create(window), {
    location: { pathname, replace },
  }));
  render(<MemoryRouter initialEntries={[pathname]}><App /></MemoryRouter>);
  fireEvent.click(screen.getByText('play'));
  if (pathname.startsWith('/main/play/')) {
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText('play')).toBeInTheDocument();
  } else {
    expect(replace).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith('/main/play/fantasy?lessonId=123#run');
    expect(screen.getByText('loading')).toBeInTheDocument();
  }
});

it('reloads on leaving games so public pages receive their own document policy', () => {
  const replace = vi.fn();
  vi.stubGlobal('window', Object.assign(Object.create(window), {
    location: { pathname: '/main/play', replace },
  }));
  const Leave = () => {
    const navigate = useNavigate();
    return <button onClick={() => navigate('/main/lessons/abc')}>leave</button>;
  };
  render(<MemoryRouter initialEntries={['/main/play']}><Leave /><App /></MemoryRouter>);
  fireEvent.click(screen.getByText('leave'));
  expect(replace).toHaveBeenCalledWith('/main/lessons/abc');
});
