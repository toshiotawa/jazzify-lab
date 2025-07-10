import React, { useState } from 'react';
import { useDiaryStore } from '@/stores/diaryStore';

const MAX_LEN = 1000;

const DiaryEditor: React.FC = () => {
  const { add, todayPosted } = useDiaryStore();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const disabled = todayPosted || submitting || text.trim().length === 0;

  return (
    <div className="mb-4 p-4 bg-slate-800 rounded-lg">
      <h4 className="font-bold mb-2">今日の練習日記</h4>
      {todayPosted ? (
        <p className="text-sm text-emerald-400">本日は投稿済みです。明日また書きましょう！</p>
      ) : (
        <>
          <textarea
            className="textarea textarea-bordered w-full mb-2"
            maxLength={MAX_LEN}
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="今日の気づき、練習内容などを共有しましょう (最大1000文字)"
          />
          <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
            <span>{text.length}/{MAX_LEN}</span>
            <span>投稿すると +5,000 XP</span>
          </div>
          <button className="btn btn-sm btn-primary w-full" disabled={disabled} onClick={async ()=>{
            setSubmitting(true);
            try {
              await add(text.trim());
              setText('');
            } catch (e:any) {
              alert(e.message);
            } finally { setSubmitting(false); }
          }}>投稿する</button>
        </>
      )}
    </div>
  );
};

export default DiaryEditor; 