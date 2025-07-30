# Project Structure

```
├── $HOME
├── dist
│   ├── assets
│   ├── attack_icons
│   ├── data
│   ├── js
│   ├── monster_icons
│   ├── sounds
│   ├── wasm
│   ├── bill-evans-alice-in-wonderland.json
│   ├── demo-1.json
│   ├── demo-1.mp3
│   ├── demo-1.xml
│   └── index.html
├── docs
│   ├── リズムモードdiff.md
│   ├── リズムモード実装計画.md
│   ├── リズムモード要件定義書.md
│   └── リズムモード設計書.md
├── netlify
│   └── functions
│       ├── createCheckoutSession.ts
│       ├── createPortalSession.ts
│       ├── stripeWebhook.ts
│       └── updateCustomerEmail.ts
├── old_files
│   ├── wasm
│   │   ├── package.json
│   │   ├── pitch_detector_bg.wasm
│   │   ├── pitch_detector_bg.wasm.d.ts
│   │   ├── pitch_detector.d.ts
│   │   └── pitch_detector.js
│   ├── audio-controller.js
│   ├── audio-worklet-processor.js
│   └── pitch_detector.js
├── public
│   ├── attack_icons
│   │   ├── fukidashi_onpu_white.png
│   │   └── swingswingswing.png
│   ├── data
│   │   ├── anger.svg
│   │   ├── character_monster_devil_purple.png
│   │   ├── character_monster_devil_purple.svg
│   │   ├── character_monster_dragon_01_red.png
│   │   ├── character_monster_dragon_01_red.svg
│   │   ├── character_monster_mao_01.png
│   │   ├── character_monster_mao_01.svg
│   │   ├── character_monster_mummy_red.png
│   │   ├── character_monster_mummy_red.svg
│   │   ├── character_monster_shinigami_01.png
│   │   ├── character_monster_shinigami_01.svg
│   │   ├── character_monster_slime_green.png
│   │   ├── character_monster_slime_green.svg
│   │   ├── character_monster_slime_red.png
│   │   ├── character_monster_slime_red.svg
│   │   ├── character_monster_zombie_brown.png
│   │   ├── character_monster_zombie_brown.svg
│   │   ├── fire.png
│   │   ├── fukidashi_onpu_white.png
│   │   ├── gaikotsu_01.png
│   │   ├── gaikotsu_01.svg
│   │   ├── grey_green.png
│   │   ├── grey_green.svg
│   │   ├── hammer.png
│   │   ├── hammer.svg
│   │   ├── ice.png
│   │   ├── jackolantern_01_orange.png
│   │   ├── jackolantern_01_orange.svg
│   │   ├── kaseijin_green.png
│   │   ├── kaseijin_green.svg
│   │   ├── komori_01.png
│   │   ├── komori_01.svg
│   │   ├── komori_02.png
│   │   ├── komori_02.svg
│   │   ├── thunder.png
│   │   ├── yurei_halloween_orange.png
│   │   └── yurei_halloween_orange.svg
│   ├── js
│   │   └── audio
│   │       └── audio-worklet-processor.js
│   ├── monster_icons
│   │   ├── monster_01.png
│   │   ├── monster_02.png
│   │   ├── monster_03.png
│   │   ├── monster_04.png
│   │   ├── monster_05.png
│   │   ├── monster_06.png
│   │   ├── monster_07.png
│   │   ├── monster_08.png
│   │   ├── monster_09.png
│   │   ├── monster_10.png
│   │   ├── monster_11.png
│   │   ├── monster_12.png
│   │   ├── monster_13.png
│   │   ├── monster_14.png
│   │   ├── monster_15.png
│   │   ├── monster_16.png
│   │   ├── monster_17.png
│   │   ├── monster_18.png
│   │   ├── monster_19.png
│   │   ├── monster_20.png
│   │   ├── monster_21.png
│   │   ├── monster_22.png
│   │   ├── monster_23.png
│   │   ├── monster_24.png
│   │   ├── monster_25.png
│   │   ├── monster_26.png
│   │   ├── monster_27.png
│   │   ├── monster_28.png
│   │   ├── monster_29.png
│   │   ├── monster_30.png
│   │   ├── monster_31.png
│   │   ├── monster_32.png
│   │   ├── monster_33.png
│   │   ├── monster_34.png
│   │   ├── monster_35.png
│   │   ├── monster_36.png
│   │   ├── monster_37.png
│   │   ├── monster_38.png
│   │   ├── monster_39.png
│   │   ├── monster_40.png
│   │   ├── monster_41.png
│   │   ├── monster_42.png
│   │   ├── monster_43.png
│   │   ├── monster_44.png
│   │   ├── monster_45.png
│   │   ├── monster_46.png
│   │   ├── monster_47.png
│   │   ├── monster_48.png
│   │   ├── monster_49.png
│   │   ├── monster_50.png
│   │   ├── monster_51.png
│   │   ├── monster_52.png
│   │   ├── monster_53.png
│   │   ├── monster_54.png
│   │   ├── monster_55.png
│   │   ├── monster_56.png
│   │   ├── monster_57.png
│   │   ├── monster_58.png
│   │   ├── monster_59.png
│   │   ├── monster_60.png
│   │   ├── monster_61.png
│   │   ├── monster_62.png
│   │   └── monster_63.png
│   ├── sounds
│   │   ├── enemy_attack.mp3
│   │   └── my_attack.mp3
│   ├── wasm
│   │   └── pitch_detector_bg.wasm
│   ├── bill-evans-alice-in-wonderland.json
│   ├── demo-1.json
│   ├── demo-1.mp3
│   └── demo-1.xml
├── scripts
│   ├── backup-database.js
│   ├── check-admin-status.sql
│   ├── check-profiles-rls.sql
│   ├── create-profile-admin.sql
│   ├── create-profile.sql
│   ├── create-storage-bucket.js
│   ├── diagnose-profile-creation.sql
│   ├── fix-storage-rls.sql
│   ├── init-storage-buckets.js
│   ├── quick-fix-admin.sql
│   ├── simple-create-admin.sql
│   ├── temporary-fix-rls.sql
│   └── toggle-songs-rls.sql
├── src
│   ├── components
│   │   ├── admin
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AnnouncementManager.tsx
│   │   │   ├── CourseManager.tsx
│   │   │   ├── FantasyStageSelector.tsx
│   │   │   ├── LessonManager.tsx
│   │   │   ├── MissionManager.tsx
│   │   │   ├── SongManager.tsx
│   │   │   ├── SongSelector.tsx
│   │   │   └── UserManager.tsx
│   │   ├── auth
│   │   │   ├── AuthCallback.tsx
│   │   │   ├── AuthGate.tsx
│   │   │   ├── AuthLanding.tsx
│   │   │   ├── ProfileWizard.tsx
│   │   │   └── VerifyOtpPage.tsx
│   │   ├── dashboard
│   │   │   └── Dashboard.tsx
│   │   ├── diary
│   │   │   ├── DiaryEditor.tsx
│   │   │   ├── DiaryFeed.tsx
│   │   │   ├── DiaryModal.tsx
│   │   │   └── DiaryPage.tsx
│   │   ├── fantasy
│   │   │   ├── FantasyEffects.tsx
│   │   │   ├── FantasyGameEngine.tsx
│   │   │   ├── FantasyGameScreen.tsx
│   │   │   ├── FantasyMain.tsx
│   │   │   ├── FantasyMonster.tsx
│   │   │   ├── FantasyPIXIRenderer.tsx
│   │   │   ├── FantasySettingsModal.tsx
│   │   │   └── FantasyStageSelect.tsx
│   │   ├── game
│   │   │   ├── ChordOverlay.tsx
│   │   │   ├── ControlBar.tsx
│   │   │   ├── GameEngine.tsx
│   │   │   ├── GameScreen.tsx
│   │   │   ├── PIXINotesRenderer.tsx
│   │   │   ├── PIXINotesRenderer.tsx.backup
│   │   │   ├── ResultModal.tsx
│   │   │   └── SheetMusicDisplay.tsx
│   │   ├── information
│   │   │   └── InformationPage.tsx
│   │   ├── lesson
│   │   │   ├── LessonDetailPage.tsx
│   │   │   └── LessonPage.tsx
│   │   ├── mission
│   │   │   ├── ChallengeBoard.tsx
│   │   │   ├── ChallengeCard.tsx
│   │   │   ├── ChallengeProgressWidget.tsx
│   │   │   ├── MissionPage.tsx
│   │   │   └── MissionSongProgress.tsx
│   │   ├── ranking
│   │   │   ├── LevelRanking.tsx
│   │   │   └── MissionRanking.tsx
│   │   ├── subscription
│   │   │   └── PricingTable.tsx
│   │   ├── ui
│   │   │   ├── AccountModal.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── GameHeader.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── MidiDeviceManager.tsx
│   │   │   ├── MypageModal.tsx
│   │   │   ├── ResizeHandle.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   └── VolumeSlider.tsx
│   │   └── LandingPage.tsx
│   ├── data
│   │   ├── bill-evans-alice-in-wonderland.json
│   │   ├── fire.png
│   │   ├── ice.png
│   │   ├── monsters.ts
│   │   ├── thunder.png
│   │   ├── ドラキュラアイコン8.svg
│   │   ├── 怪獣アイコン.svg
│   │   ├── 死神アイコン1.svg
│   │   ├── 海の怪物クラーケンのアイコン素材.svg
│   │   ├── 狼男のイラスト4.svg
│   │   └── 魔王のアイコン素材.svg
│   ├── lib
│   │   ├── fantasy
│   │   │   └── position.ts
│   │   └── utils.ts
│   ├── platform
│   │   ├── index.ts
│   │   ├── supabaseAdmin.ts
│   │   ├── supabaseAnnouncements.ts
│   │   ├── supabaseChallenges.ts
│   │   ├── supabaseClient.ts
│   │   ├── supabaseCourses.ts
│   │   ├── supabaseDiary.ts
│   │   ├── supabaseFantasyStages.ts
│   │   ├── supabaseLessonContent.ts
│   │   ├── supabaseLessonProgress.ts
│   │   ├── supabaseLessonRequirements.ts
│   │   ├── supabaseLessons.ts
│   │   ├── supabaseMissions.ts
│   │   ├── supabaseRanking.ts
│   │   ├── supabaseSongs.ts
│   │   ├── supabaseStorage.ts
│   │   ├── supabaseTitles.ts
│   │   ├── supabaseUserStats.ts
│   │   ├── supabaseXp.ts
│   │   ├── unifiedSongConditions.ts
│   │   └── unifiedSongProgress.ts
│   ├── stores
│   │   ├── authStore.ts
│   │   ├── diaryStore.ts
│   │   ├── enemyStore.ts
│   │   ├── gameStore.ts
│   │   ├── helpers.ts
│   │   ├── missionStore.ts
│   │   ├── toastStore.ts
│   │   └── userStatsStore.ts
│   ├── types
│   │   ├── global.d.ts
│   │   ├── index.ts
│   │   └── osmd.d.ts
│   ├── utils
│   │   ├── achievementTitles.ts
│   │   ├── chord-templates.ts
│   │   ├── chord-utils.ts
│   │   ├── cn.ts
│   │   ├── constants.ts
│   │   ├── display-note.ts
│   │   ├── FantasySoundManager.ts
│   │   ├── gameEngine.ts
│   │   ├── imageCompression.ts
│   │   ├── lessonNavigation.ts
│   │   ├── lightweightConfig.ts
│   │   ├── localStorage.ts
│   │   ├── logger.ts
│   │   ├── magicLinkConfig.ts
│   │   ├── markdown.ts
│   │   ├── MidiController.ts
│   │   ├── musicXmlMapper.ts
│   │   ├── musicXmlTransposer.ts
│   │   ├── performanceOptimizer.ts
│   │   ├── titleConstants.ts
│   │   └── xpCalculator.ts
│   ├── wasm
│   │   ├── pitch_detector_bg.wasm.d.ts
│   │   ├── pitch_detector.d.ts
│   │   └── pitch_detector.js
│   ├── App.tsx
│   ├── index.css
│   ├── LegacyApp.tsx
│   └── main.tsx
├── supabase
│   ├── functions
│   │   └── reset-season-multiplier
│   │       └── index.ts
│   ├── migrations
│   │   ├── 20250124000000_update_xp_calculation.sql
│   │   ├── 20250125000000_add_fantasy_lesson_conditions.sql
│   │   ├── 20250721120000_add_stripe_subscription_fields.sql
│   │   ├── 20250721130000_create_fantasy_mode_tables.sql
│   │   ├── 20250721130001_add_simultaneous_monsters.sql
│   │   ├── 20250721130002_increase_simultaneous_monsters.sql
│   │   ├── 20250726000000_add_guide_display_to_fantasy_stages.sql
│   │   ├── 20250728155235_add_fantasy_stages_to_lesson_songs.sql
│   │   ├── 20250728163641_fix_lesson_songs_constraint.sql
│   │   ├── 20250728224819_add_lesson_song_id_to_progress.sql
│   │   ├── 20250728225530_fix_progress_table_constraints.sql
│   │   ├── 20250728230000_fix_rpc_conflict_handling.sql
│   │   └── 20250730000001_rollback_multi_monster_features.sql
│   ├── migrations_backup
│   │   ├── 20250710162113_remote_schema.sql
│   │   ├── 20250710162450_remove_auth_trigger.sql
│   │   ├── 20250710162452_add_challenge_category.sql
│   │   ├── 20250710162453_shift_lesson_order_index.sql
│   │   ├── 20250710162454_add_storage_rls_policies.sql
│   │   ├── 20250710163000_fix_profiles_schema.sql
│   │   ├── 20250710164500_fix_schema_final.sql
│   │   ├── 20250710165000_fix_display_name_to_nickname.sql
│   │   ├── 20250710165001_cleanup_orphaned_users.sql
│   │   ├── 20250711004603_fix_diary_foreign_keys.sql
│   │   ├── 20250711005214_fix_diary_comment_user_fk.sql
│   │   ├── 20250711020000_add_bio_to_profiles.sql
│   │   ├── 20250712113748_add_song_file_urls.sql
│   │   ├── 20250712120806_remove_bpm_difficulty_constraints.sql
│   │   ├── 20250712121330_remove_asset_url_column.sql
│   │   ├── 20250712122653_add_songs_rls_policies.sql
│   │   ├── 20250713023846_add_course_order_index.sql
│   │   ├── 20250714000000_update_songs_schema_comprehensive.sql
│   │   ├── 20250714010000_add_song_usage_type_and_lesson_songs.sql
│   │   ├── 20250715033341_add_twitter_handle_to_profiles.sql
│   │   ├── 20250715060605_add_selected_title_to_profiles_new.sql
│   │   ├── 20250715100000_add_course_and_lesson_management.sql
│   │   ├── 20250716220027_add_notation_setting_to_challenge_tracks.sql
│   │   ├── 20250716221155_add_user_challenge_progress_table.sql
│   │   ├── 20250717120000_add_lesson_requirements_progress.sql
│   │   ├── 20250717125000_add_daily_progress_tracking.sql
│   │   ├── 20250718000000_add_lesson_blocks.sql
│   │   ├── 20250718000001_add_image_url_to_practice_diaries.sql
│   │   ├── 20250718010000_add_mission_multiplier.sql
│   │   ├── 20250718120000_add_user_song_progress_and_b_rank_plus_count.sql
│   │   ├── 20250718130000_add_reward_claimed_to_user_challenge_progress.sql
│   │   ├── 20250718140000_add_xp_function.sql
│   │   ├── 20250718140001_create_diary_images_bucket.sql
│   │   ├── 20250718150000_add_user_song_stats_rls.sql
│   │   ├── 20250719000000_add_reason_to_xp_history.sql
│   │   ├── 20250719010000_create_unified_song_conditions.sql
│   │   ├── 20250719020000_create_unified_song_progress.sql
│   │   ├── 20250720000000_add_category_to_challenges_fixed.sql
│   │   ├── 20250720001000_add_song_clear_count_to_challenges.sql
│   │   ├── 20250721000000_add_reward_claimed_column.sql
│   │   ├── 20250721041959_restore_complete_schema.sql
│   │   ├── 20250721042308_create_initial_schema.sql
│   │   ├── 20250721120000_add_stripe_subscription_fields copy.sql
│   │   ├── 20250721120000_add_stripe_subscription_fields.sql
│   │   ├── 20250721130000_create_fantasy_mode_tables.sql
│   │   ├── 20250722000000_fix_admin_profiles_update_policy.sql
│   │   ├── 20250722210000_add_course_unlock_management.sql
│   │   ├── 20250723120000_fix_admin_course_functions.sql
│   │   ├── 20250723131738_restore_profiles_columns.sql
│   │   ├── 20250723133835_restore_critical_tables_columns.sql
│   │   ├── 20250724000000_restore_missing_tables.sql
│   │   ├── 20250724000001_update_schema_file.sql
│   │   ├── 20250724000003_restore_user_lesson_requirements_progress.sql
│   │   ├── 20250724000006_restore_assignment_description_to_lessons.sql
│   │   ├── 20250724000007_restore_block_number_to_lessons.sql
│   │   ├── 20250725000000_add_diary_update_delete_policies.sql
│   │   ├── 20250725000001_fix_profiles_rls_policies.sql
│   │   ├── 20250726000000_add_guide_display_to_fantasy_stages.sql
│   │   └── 20250730000001_rollback_multi_monster_features.sql
│   ├── migrations_old
│   │   ├── 20250721120000_add_stripe_subscription_fields.sql
│   │   ├── 20250721130000_create_fantasy_mode_tables.sql
│   │   ├── 20250726000000_add_guide_display_to_fantasy_stages.sql
│   │   └── 20250730000001_rollback_multi_monster_features.sql
│   ├── schemas
│   │   ├── profiles_rls.sql
│   │   └── schema.sql
│   ├── config.toml
│   └── README_RESTORE_TABLES.md
├── wasm
│   ├── package.json
│   ├── pitch_detector_bg.wasm
│   ├── pitch_detector_bg.wasm.d.ts
│   ├── pitch_detector.d.ts
│   └── pitch_detector.js
├── AGENTS.md
├── AudioController.ts
├── backup_data.sql
├── CLAUDE.md
├── components.json
├── copilot-instructions.md
├── demo-1.json
├── demo-1.mp3
├── DIARY_IMAGE_IMPLEMENTATION.md
├── et --hard 662adf6
├── et --hard 8738d30
├── et --hard a91324a
├── et --hard HEAD~1
├── IMPLEMENTATION_SUMMARY.md
├── index.html
├── MidiController.ts
├── netlify.toml
├── optimize-performance.js
├── package-lock.json
├── package.json
├── Piano.ts
├── postcss.config.js
├── README.md
├── schema_dump.sql
├── STRIPE_IMPLEMENTATION_SUMMARY.md
├── STRIPE_SETUP.md
├── SUPABASE_AUTH_SETUP.md
├── tailwind.config.js
├── tatus
├── ter
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.dev.ts
├── vite.config.ts
└── 要件定義書.md
```

# File Contents

## docs\リズムモード設計書.md

```markdown
設計書: ファンタジーモードへのリズムタイプ追加

本設計書は、ファンタジーモードに「リズムタイプ」を追加するためのシステム設計を詳細に記述したものである。この設計は、要件書で定義された仕様に基づき、既存のクイズタイプを維持しつつ、新たなリズムベースのゲームプレイを統合するアーキテクチャを提案する。全体の設計は、Zustandによる状態管理の統一、MP3ファイルのループ再生、判定タイミングの許容範囲などの共通要件を考慮し、拡張性とパフォーマンスを重視したものとする。コンポーネントベースの構造を採用し、フロントエンド（React/PIXI.js）とバックエンド（Supabase）の連携を明確に定義する。これにより、開発の効率化とメンテナンス性を確保し、ユーザーの没入感を高めるゲーム体験を実現する。以下では、システム全体のアーキテクチャから詳細なコンポーネント設計、データモデル、潜在的な課題と解決策までを、論理的かつ流れるような形で説明する。

システムアーキテクチャ

ファンタジーモードの全体アーキテクチャは、既存の構造を基盤としつつ、リズムタイプの追加により拡張される。フロントエンドはReactコンポーネントを基調とし、PIXI.jsを活用したビジュアルレンダリング（FantasyPIXIRenderer）とゲームロジック（FantasyGameEngine）を分離する形で構成される。状態管理にはZustandを統一的に使用し、時間管理（曲の再生タイミング、ゲージ進行）をグローバルに制御する。これにより、クイズタイプとリズムタイプの切り替えがシームレスに行える。バックエンドはSupabaseを活用し、ステージデータ（game_type, rhythm_patternなど）をデータベースから動的に取得。曲の再生はTone.jsを介してMP3ファイルを扱い、無限ループを実装する。データフローは、ステージ選択（FantasyStageSelect）からゲーム画面（FantasyGameScreen）への遷移を起点とし、エンジン内で入力処理と判定を行い、UIに反映される。リズムタイプ特有のタイミング判定は、Zustandのストアで管理されるグローバルタイムラインに基づき、±200msの許容範囲を計算する。このアーキテクチャにより、モード間の共通部分を共有しつつ、サブモード（ランダム/プログレッション）の差異を最小限のコードで扱える。

コンポーネント設計

システムの主要コンポーネントは、以下の階層構造で設計される。トップレベルとしてFantasyMainがルーティングを管理し、FantasyStageSelectでステージを選択する。選択後、FantasyGameScreenがゲームUIをレンダリングし、内部でFantasyGameEngine（ロジック）とFantasyPIXIRenderer（ビジュアル）を統合する。リズムタイプ追加に伴い、エンジンにタイミング判定モジュールを新設し、Zustandストアで曲の再生状態（BPM, 拍子, 小節数）を保持する。FantasyEffectsコンポーネントはエフェクト（魔法陣、ダメージテキスト）を扱い、PIXI.jsでアニメーションを実現。設定モーダル（FantasySettingsModal）は、ガイド表示や音量調整を制御し、エンジンに反映される。データ取得はSupabaseクライアント経由で非同期に行い、キャッシュを活用してパフォーマンスを最適化する。この設計により、クイズタイプの既存コンポーネントを再利用しつつ、リズムタイプの新要素（ループ再生、タイミング判定）をモジュール化して追加可能となる。各コンポーネントの責務分離により、テスト容易性が高まる。

FantasyGameEngine: ゲームロジックの中核。リズムタイプでは、Zustandから取得したグローバルタイムに基づき、判定タイミングを計算（例: 拍番号1.5の場合、BPMからミリ秒を導出）。ランダムパターンではallowed_chordsからコードをランダム選択し、プログレッションではchord_progressionをループ処理。失敗時はゲージを即座に満タンにし、onEnemyAttackコールバックをトリガー。成功時はonChordCorrectを呼び、敵HPを減少させる。無限リピート時は状態を保持し、リセットを防ぐ。
FantasyPIXIRenderer: ビジュアルレンダリング。リズムタイプでモンスターのゲージをリアルタイム更新し、同時出現数に応じて配置を動的に調整（例: 4体時はABCD列）。エフェクト（魔法名表示、ダメージ数値）はCSSアニメーションをPIXIに統合し、パフォーマンスを確保。
FantasyGameScreen: UIレイアウト。リズムタイプでは曲再生UIを追加し、ガイド表示（showGuide=true時）を鍵盤にオーバーレイ。判定結果を即時反映し、失敗時の敵攻撃アニメーションをトリガー。
FantasyStageSelect: ステージ選択画面。データベースからgame_typeを取得し、リズムタイプのステージを区別表示。rhythm_patternに基づくUIヒントを追加。
データモデル

データモデルは、Supabaseの既存テーブルを拡張する形で設計される。fantasy_stagesテーブルにgame_type (varchar: "quiz" | "rhythm")とrhythm_pattern (varchar: "random" | "progression")を追加。リズム関連としてbpm (int4)、time_signature (int4: 3 or 4)、loop_measures (int4)、chord_progression_data (jsonb: コード進行のJSON配列、タイミング情報含む)を定義。これにより、ステージごとのモード割り当てが可能となる。ゲーム状態はZustandストアで管理し、FantasyGameStateインターフェースで型付け（playerHp, enemyGauge, activeMonsters配列など）。コード定義（ChordDefinition）はnotes (number[]: MIDIノート)、noteNames (string[]: 音名)を保持し、displayOptsで言語/簡易化を動的に適用。無限リピート時はchord_progression_dataのオフセットをストアで保持し、ループ時の状態継続を実現する。

データフローとタイミング管理

データフローは、ステージ選択からエンジン初期化へ移行し、Zustandで時間軸を統一管理する。曲再生時はTone.jsでMP3をループ（loop_measuresに基づき2小節目にジャンプ）。タイミング判定は、グローバルタイムから小節/拍を計算し、±200msの範囲で入力を検証。成功時は敵HP減少とコールバック、失敗時はゲージ満タンと敵攻撃を即時実行。プログレッションの補充は、配列ベースのキュー管理で実現（例: ミス時の列スキップ）。懸念の無限リピート時は、ストアのオフセットで状態を保持し、ゲージの継続性を確保する。

潜在的な課題と解決策

潜在的な課題として、無限リピート時のゲージ同期が挙げられるが、Zustandのグローバルタイムで解決。同時出現数が多い場合のパフォーマンス低下は、PIXI.jsのバッチレンダリングで最適化。データベース変更はマイグレーションスクリプトで安全に適用し、既存データへの影響を最小限とする。この設計により、要件を満たしつつ、将来の拡張性を確保する。
```

