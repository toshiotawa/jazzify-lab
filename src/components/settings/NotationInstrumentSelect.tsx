import React from 'react';
import {
  NOTATION_INSTRUMENT_PRESETS,
  normalizeNotationInstrumentId,
  type NotationInstrumentId,
} from '@/utils/notationInstrument';

interface NotationInstrumentSelectProps {
  value: NotationInstrumentId;
  onChange: (value: NotationInstrumentId) => void;
  isEnglishCopy: boolean;
  id?: string;
  className?: string;
}

export const NotationInstrumentSelect: React.FC<NotationInstrumentSelectProps> = ({
  value,
  onChange,
  isEnglishCopy,
  id = 'notation-instrument-select',
  className = 'select select-bordered w-full',
}) => (
  <select
    id={id}
    className={className}
    value={value}
    onChange={(event) => onChange(normalizeNotationInstrumentId(event.target.value))}
  >
    {NOTATION_INSTRUMENT_PRESETS.map((preset) => (
      <option key={preset.id} value={preset.id}>
        {isEnglishCopy ? preset.label.en : preset.label.ja}
      </option>
    ))}
  </select>
);
