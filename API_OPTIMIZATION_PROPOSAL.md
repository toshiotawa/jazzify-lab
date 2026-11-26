# API最適化提案

## 現状の問題点

タブを軽く移動するだけで多くのAPIリクエストが発生しています。主な原因は：

1. **ページ遷移時の無条件API呼び出し**
2. **キャッシュの有効活用不足**
3. **重複したデータ取得**

## 最適化案

### 1. ダッシュボードの最適化

**現状のコード（Dashboard.tsx）:**
```typescript
useEffect(() => {
  if (open) {
    loadDashboardData();
  }
}, [open, isGuest]);
```

**改善案:**
```typescript
// 最後の読み込み時刻を追跡
const [lastLoadTime, setLastLoadTime] = useState<number>(0);
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5分

useEffect(() => {
  if (open) {
    const now = Date.now();
    // 前回の読み込みから5分以上経過した場合のみ再読み込み
    if (now - lastLoadTime > REFRESH_INTERVAL) {
      loadDashboardData();
      setLastLoadTime(now);
    }
  }
}, [open, isGuest]);
```

### 2. ミッションストアの最適化

**現状のコード（missionStore.ts）:**
```typescript
fetchAll: async () => {
  set(s=>{s.loading=true;});
  const [missions, progress] = await Promise.all([
    fetchActiveMonthlyMissions(),
    fetchUserMissionProgress(),
  ]);
  // ...
},
```

**改善案:**
```typescript
interface State {
  // 既存のstate
  lastFetchTime: number;
}

fetchAll: async (forceRefresh = false) => {
  const now = Date.now();
  const CACHE_DURATION = 10 * 60 * 1000; // 10分
  
  // forceRefreshがfalseで、前回取得から10分以内の場合はスキップ
  if (!forceRefresh && now - get().lastFetchTime < CACHE_DURATION) {
    return;
  }
  
  set(s=>{s.loading=true; s.lastFetchTime=now;});
  // 既存の処理...
},
```

### 3. ユーザー統計キャッシュの延長

**現状のコード（supabaseUserStats.ts）:**
```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5分
```

**改善案:**
```typescript
const CACHE_DURATION = 30 * 60 * 1000; // 30分に延長
```

### 4. グローバルキャッシュマネージャーの導入

新しいファイル: `src/utils/globalCacheManager.ts`
```typescript
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class GlobalCacheManager {
  private cache = new Map<string, CacheEntry>();
  
  set(key: string, data: any, ttl: number = 10 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  invalidate(pattern?: RegExp) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export const globalCache = new GlobalCacheManager();
```

### 5. APIリクエストの統合

複数のコンポーネントで同じデータを取得している場合は、親コンポーネントで一度だけ取得し、propsやcontextで共有する。

### 6. リアルタイムサブスクリプションの最適化

**改善案（supabaseClient.ts）:**
```typescript
// リアルタイムイベントレートを削減
realtime: {
  params: {
    eventsPerSecond: 2, // 5 → 2に削減（60%削減）
  }
}
```

### 7. デバウンスとスロットリングの活用

頻繁に呼ばれる可能性のある関数にデバウンスを適用：

```typescript
import { debounce } from 'lodash';

const debouncedFetchStats = debounce(fetchStats, 1000);
```

## 実装優先順位

1. **高優先度** - ダッシュボードとミッションページのキャッシュ実装
2. **中優先度** - ユーザー統計キャッシュの延長
3. **低優先度** - グローバルキャッシュマネージャーの導入

## 期待される効果

- APIリクエスト数を約70%削減
- ページ遷移時のレスポンス向上
- サーバー負荷の軽減
- ユーザー体験の改善