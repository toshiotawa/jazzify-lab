import { render } from '@testing-library/react';
import RhythmNotesRenderer from '@/components/rhythm/RhythmNotesRenderer';

it('renders component without crashing', () => {
  render(<RhythmNotesRenderer width={800} height={120} />);
});