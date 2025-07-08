import React from 'react'
import { useGameStore } from '../stores/gameStore'

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useGameStore()

  const handleVolumeChange = (type: 'masterVolume' | 'musicVolume' | 'midiVolume', value: number) => {
    updateSettings({ [type]: value })
  }

  const handleCheckboxChange = (setting: string, checked: boolean) => {
    updateSettings({ [setting]: checked })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">設定</h1>
      
      <div className="space-y-6">
        {/* 音量設定 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">音量設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                マスター音量: {Math.round(settings.masterVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('masterVolume', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音楽音量: {Math.round(settings.musicVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.musicVolume}
                onChange={(e) => handleVolumeChange('musicVolume', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MIDI音量: {Math.round(settings.midiVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.midiVolume}
                onChange={(e) => handleVolumeChange('midiVolume', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 表示設定 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">表示設定</h2>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showNoteNames}
                onChange={(e) => handleCheckboxChange('showNoteNames', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">ノート名を表示</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showFPS}
                onChange={(e) => handleCheckboxChange('showFPS', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">FPS表示</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showSheetMusic}
                onChange={(e) => handleCheckboxChange('showSheetMusic', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">楽譜を表示</span>
            </label>
          </div>
        </div>

        {/* ゲーム設定 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ゲーム設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ノート速度: {settings.notesSpeed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="4.0"
                step="0.1"
                value={settings.notesSpeed}
                onChange={(e) => updateSettings({ notesSpeed: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                移調: {settings.transpose > 0 ? '+' : ''}{settings.transpose}半音
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={settings.transpose}
                onChange={(e) => updateSettings({ transpose: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowOctaveError}
                onChange={(e) => handleCheckboxChange('allowOctaveError', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">オクターブエラーを許可</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}