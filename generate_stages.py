#!/usr/bin/env python3
# ファンタジーモードBASICステージ6-10のデータを生成するスクリプト

import json

# BGM URLs
bgm_urls = [
    'https://jazzify-cdn.com/fantasy-bgm/f1394110-0bc3-4e6b-86fe-70d2b5795a42.mp3',
    'https://jazzify-cdn.com/fantasy-bgm/9afb5319-7ebe-4e01-8bf2-4509b5c20de7.mp3',
    'https://jazzify-cdn.com/fantasy-bgm/26de516b-a972-4991-9110-37d10d9bae65.mp3',
    'https://jazzify-cdn.com/fantasy-bgm/717e9562-9612-46b0-8358-e170f5a5530d.mp3'
]

# コード定義関数
def create_chord_objects(chords):
    return [f"jsonb_build_object('chord', '{chord}', 'octave', 4, 'inversion', 0)" for chord in chords]

# ステージデータ
stages_data = [
    # ステージ6: 雪原・氷結エリア
    ('6-5', 'オーロラの観測所', 'その他の3和音 dim', ['Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim', 'C#dim', 'D#dim', 'F#dim', 'G#dim', 'A#dim']),
    ('6-6', '樹氷の森', 'その他の3和音 aug', ['Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug', 'Baug', 'C#aug', 'D#aug', 'F#aug', 'G#aug', 'A#aug']),
    ('6-7', '雪山の秘湯', 'その他の3和音 dimとaug曲', ['Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim', 'C#dim', 'D#dim', 'F#dim', 'G#dim', 'A#dim', 'Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug', 'Baug', 'C#aug', 'D#aug', 'F#aug', 'G#aug', 'A#aug']),
    ('6-8', '氷晶の城塞', 'その他の3和音 まとめ曲1', ['Csus4', 'Dsus4', 'Esus4', 'Fsus4', 'Gsus4', 'Asus4', 'Bsus4', 'C#sus4', 'D#sus4', 'F#sus4', 'G#sus4', 'A#sus4', 'Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim', 'C#dim', 'D#dim', 'F#dim', 'G#dim', 'A#dim', 'Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug', 'Baug', 'C#aug', 'D#aug', 'F#aug', 'G#aug', 'A#aug']),
    ('6-9', '極寒の牢獄', 'その他の3和音 まとめ曲2', ['Csus4', 'Dsus4', 'Esus4', 'Fsus4', 'Gsus4', 'Asus4', 'Bsus4', 'C#sus4', 'D#sus4', 'F#sus4', 'G#sus4', 'A#sus4', 'Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim', 'C#dim', 'D#dim', 'F#dim', 'G#dim', 'A#dim', 'Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug', 'Baug', 'C#aug', 'D#aug', 'F#aug', 'G#aug', 'A#aug']),
    ('6-10', '銀世界の雪原', 'メジャーとマイナートライアド(全てのルート、single)', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm', 'C#m', 'D#m', 'F#m', 'G#m', 'A#m']),

    # ステージ7: 火山・焦土エリア
    ('7-1', '火口への道', '度数 2度と3度', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#']),
    ('7-2', '溶岩の回廊', '度数 4度と5度', ['C', 'F', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#']),
    ('7-3', '炎の鍛冶場', '度数 6度と7度', ['C', 'A', 'B', 'D', 'E', 'F', 'G', 'C#', 'D#', 'F#', 'G#', 'A#']),
    ('7-4', '焦土の荒野', '度数 上まとめ1', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#']),
    ('7-5', '噴煙の地帯', '度数 上まとめ2', ['C#', 'D#', 'F#', 'G#', 'A#']),
    ('7-6', '不死鳥の棲家', '度数 2度と3度下', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#']),
    ('7-7', '灰の降る街', '度数 4度と5度下', ['C', 'F', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#']),
    ('7-8', '獄炎の神殿', '度数 6度と7度下', ['C', 'A', 'B', 'D', 'E', 'F', 'G', 'C#', 'D#', 'F#', 'G#', 'A#']),
    ('7-9', 'マグマ溜まり', '度数 下まとめ', ['C', 'F', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#']),
    ('7-10', '煉獄の門', '度数 上下MIX', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#']),

    # ステージ8: 天空・魔法・機械エリア
    ('8-1', '天空の庭園', 'メジャースケール、ナチュラルマイナースケール C.F.Gのみ、single', ['C', 'F', 'G', 'Cm', 'Fm', 'Gm']),
    ('8-2', '浮遊大陸の縁', 'メジャースケール、ナチュラルマイナースケール D.A.E.Bのみ、single', ['D', 'A', 'E', 'B', 'Dm', 'Am', 'Em', 'Bm']),
    ('8-3', '歯車の時計塔', 'メジャースケール、ナチュラルマイナースケール ♭系のみ、single', ['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'Dbm', 'Ebm', 'Gbm', 'Abm', 'Bbm']),
    ('8-4', '魔導研究所', 'メジャースケール、ナチュラルマイナースケール シャープ系のみ、single', ['C#', 'D#', 'F#', 'G#', 'A#', 'C#m', 'D#m', 'F#m', 'G#m', 'A#m']),
    ('8-5', '雲海の上', 'メジャースケール、ナチュラルマイナースケール まとめ(全てのメジャートライアド、マイナートライアド)、single', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#', 'Db', 'Eb', 'Gb', 'Ab', 'Bb', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm', 'C#m', 'D#m', 'F#m', 'G#m', 'A#m', 'Dbm', 'Ebm', 'Gbm', 'Abm', 'Bbm']),
    ('8-6', '雷鳴の平原', 'メジャースケール、ナチュラルマイナースケール Am.Dm.Emのみ、single', ['Am', 'Dm', 'Em']),
    ('8-7', '星詠みの台座', 'メジャースケール、ナチュラルマイナースケール Cm.Fm.Gmのみ、single', ['Cm', 'Fm', 'Gm']),
    ('8-8', '飛空艇ドック', 'メジャースケール、ナチュラルマイナースケール Bm.Bbm,F#mのみ、single', ['Bm', 'Bbm', 'F#m']),
    ('8-9', '虹の架け橋', 'メジャースケール、ナチュラルマイナースケール 黒鍵だけ(#系と♭系全て)、single', ['C#', 'D#', 'F#', 'G#', 'A#', 'Db', 'Eb', 'Gb', 'Ab', 'Bb', 'C#m', 'D#m', 'F#m', 'G#m', 'A#m', 'Dbm', 'Ebm', 'Gbm', 'Abm', 'Bbm']),
    ('8-10', '風の通り道', 'メジャースケール、ナチュラルマイナースケール まとめ(全てのメジャートライアド、マイナートライアド)、single', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#', 'Db', 'Eb', 'Gb', 'Ab', 'Bb', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm', 'C#m', 'D#m', 'F#m', 'G#m', 'A#m', 'Dbm', 'Ebm', 'Gbm', 'Abm', 'Bbm']),

    # ステージ9: 闇・アンデッドエリア
    ('9-1', '忘却の墓地', '4和音 メジャーセブンス(全てのルート、single)', ['CM7', 'DM7', 'EM7', 'FM7', 'GM7', 'AM7', 'BM7', 'C#M7', 'D#M7', 'F#M7', 'G#M7', 'A#M7']),
    ('9-2', '呪われた廃村', '4和音 マイナーセブンス(全てのルート、single)', ['Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7', 'C#m7', 'D#m7', 'F#m7', 'G#m7', 'A#m7']),
    ('9-3', '幽霊列車の駅', '4和音 セブンス(全てのルート、single)', ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'C#7', 'D#7', 'F#7', 'G#7', 'A#7']),
    ('9-4', 'カボチャの畑', '4和音 マイナーセブンスフラットファイブ(全てのルート、single)', ['Cm7b5', 'Dm7b5', 'Em7b5', 'Fm7b5', 'Gm7b5', 'Am7b5', 'Bm7b5', 'C#m7b5', 'D#m7b5', 'F#m7b5', 'G#m7b5', 'A#m7b5']),
    ('9-5', '魔女の館', '4和音 メジャーセブンス(全てのルート、timing_random)', ['CM7', 'DM7', 'EM7', 'FM7', 'GM7', 'AM7', 'BM7', 'C#M7', 'D#M7', 'F#M7', 'G#M7', 'A#M7']),
    ('9-6', '血の池', '4和音 マイナーセブンス(全てのルート、timing_random)', ['Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7', 'C#m7', 'D#m7', 'F#m7', 'G#m7', 'A#m7']),
    ('9-7', '枯れ木の森', '4和音 セブンス(全てのルート、timing_random)', ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'C#7', 'D#7', 'F#7', 'G#7', 'A#7']),
    ('9-8', '闇の祭壇', '4和音 マイナーセブンスフラットファイブ(全てのルート、timing_random)', ['Cm7b5', 'Dm7b5', 'Em7b5', 'Fm7b5', 'Gm7b5', 'Am7b5', 'Bm7b5', 'C#m7b5', 'D#m7b5', 'F#m7b5', 'G#m7b5', 'A#m7b5']),
    ('9-9', '影の回廊', '4和音 まとめ1.M7 m7 7 m7(b5)(全てのルート、single)', ['CM7', 'DM7', 'EM7', 'FM7', 'GM7', 'AM7', 'BM7', 'C#M7', 'D#M7', 'F#M7', 'G#M7', 'A#M7', 'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7', 'C#m7', 'D#m7', 'F#m7', 'G#m7', 'A#m7', 'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'C#7', 'D#7', 'F#7', 'G#7', 'A#7', 'Cm7b5', 'Dm7b5', 'Em7b5', 'Fm7b5', 'Gm7b5', 'Am7b5', 'Bm7b5', 'C#m7b5', 'D#m7b5', 'F#m7b5', 'G#m7b5', 'A#m7b5']),
    ('9-10', '冥府への入り口', '4和音 まとめ2.M7 m7 7 m7(b5)(全てのルート、timing_random)', ['CM7', 'DM7', 'EM7', 'FM7', 'GM7', 'AM7', 'BM7', 'C#M7', 'D#M7', 'F#M7', 'G#M7', 'A#M7', 'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7', 'C#m7', 'D#m7', 'F#m7', 'G#m7', 'A#m7', 'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'C#7', 'D#7', 'F#7', 'G#7', 'A#7', 'Cm7b5', 'Dm7b5', 'Em7b5', 'Fm7b5', 'Gm7b5', 'Am7b5', 'Bm7b5', 'C#m7b5', 'D#m7b5', 'F#m7b5', 'G#m7b5', 'A#m7b5']),

    # ステージ10: その他のセブンス
    ('10-1', '忘却の墓地', 'その他のセブンス マイナーメジャーセブンス(全てのルート、single)', ['Cm/maj7', 'Dm/maj7', 'Em/maj7', 'Fm/maj7', 'Gm/maj7', 'Am/maj7', 'Bm/maj7', 'C#m/maj7', 'D#m/maj7', 'F#m/maj7', 'G#m/maj7', 'A#m/maj7']),
    ('10-2', '呪われた廃村', 'その他のセブンス オーグメント(全てのルート、single)', ['Caug7', 'Daug7', 'Eaug7', 'Faug7', 'Gaug7', 'Aaug7', 'Baug7', 'C#aug7', 'D#aug7', 'F#aug7', 'G#aug7', 'A#aug7']),
    ('10-3', '幽霊列車の駅', 'その他のセブンス ディミニッシュ(全てのルート、single)', ['Cdim7', 'Ddim7', 'Edim7', 'Fdim7', 'Gdim7', 'Adim7', 'Bdim7', 'C#dim7', 'D#dim7', 'F#dim7', 'G#dim7', 'A#dim7']),
    ('10-4', 'カボチャの畑', 'その他のセブンス 7Sus4(全てのルート、single)', ['C7sus4', 'D7sus4', 'E7sus4', 'F7sus4', 'G7sus4', 'A7sus4', 'B7sus4', 'C#7sus4', 'D#7sus4', 'F#7sus4', 'G#7sus4', 'A#7sus4']),
    ('10-5', '魔女の館', 'その他のセブンス マイナーメジャーセブンス(全てのルート、timing_random)', ['Cm/maj7', 'Dm/maj7', 'Em/maj7', 'Fm/maj7', 'Gm/maj7', 'Am/maj7', 'Bm/maj7', 'C#m/maj7', 'D#m/maj7', 'F#m/maj7', 'G#m/maj7', 'A#m/maj7']),
    ('10-6', '血の池', 'その他のセブンス オーグメント(全てのルート、timing_random)', ['Caug7', 'Daug7', 'Eaug7', 'Faug7', 'Gaug7', 'Aaug7', 'Baug7', 'C#aug7', 'D#aug7', 'F#aug7', 'G#aug7', 'A#aug7']),
    ('10-7', '枯れ木の森', 'その他のセブンス ディミニッシュ(全てのルート、timing_random)', ['Cdim7', 'Ddim7', 'Edim7', 'Fdim7', 'Gdim7', 'Adim7', 'Bdim7', 'C#dim7', 'D#dim7', 'F#dim7', 'G#dim7', 'A#dim7']),
    ('10-8', '闇の祭壇', 'その他のセブンス 7Sus4(全てのルート、timing_random)', ['C7sus4', 'D7sus4', 'E7sus4', 'F7sus4', 'G7sus4', 'A7sus4', 'B7sus4', 'C#7sus4', 'D#7sus4', 'F#7sus4', 'G#7sus4', 'A#7sus4']),
    ('10-9', '影の回廊', 'その他のセブンス まとめ mM7 aug7 dim7 7sus4(全てのルート、timing_random)', ['Cm/maj7', 'Dm/maj7', 'Em/maj7', 'Fm/maj7', 'Gm/maj7', 'Am/maj7', 'Bm/maj7', 'C#m/maj7', 'D#m/maj7', 'F#m/maj7', 'G#m/maj7', 'A#m/maj7', 'Caug7', 'Daug7', 'Eaug7', 'Faug7', 'Gaug7', 'Aaug7', 'Baug7', 'C#aug7', 'D#aug7', 'F#aug7', 'G#aug7', 'A#aug7', 'Cdim7', 'Ddim7', 'Edim7', 'Fdim7', 'Gdim7', 'Adim7', 'Bdim7', 'C#dim7', 'D#dim7', 'F#dim7', 'G#dim7', 'A#dim7', 'C7sus4', 'D7sus4', 'E7sus4', 'F7sus4', 'G7sus4', 'A7sus4', 'B7sus4', 'C#7sus4', 'D#7sus4', 'F#7sus4', 'G#7sus4', 'A#7sus4']),
    ('10-10', '冥府への入り口', '4和音総まとめ M7 m7 7 m7(b5) mM7 aug7 dim7 7sus4(全てのルート、timing_random)', ['CM7', 'DM7', 'EM7', 'FM7', 'GM7', 'AM7', 'BM7', 'C#M7', 'D#M7', 'F#M7', 'G#M7', 'A#M7', 'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7', 'C#m7', 'D#m7', 'F#m7', 'G#m7', 'A#m7', 'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7', 'C#7', 'D#7', 'F#7', 'G#7', 'A#7', 'Cm7b5', 'Dm7b5', 'Em7b5', 'Fm7b5', 'Gm7b5', 'Am7b5', 'Bm7b5', 'C#m7b5', 'D#m7b5', 'F#m7b5', 'G#m7b5', 'A#m7b5', 'Cm/maj7', 'Dm/maj7', 'Em/maj7', 'Fm/maj7', 'Gm/maj7', 'Am/maj7', 'Bm/maj7', 'C#m/maj7', 'D#m/maj7', 'F#m/maj7', 'G#m/maj7', 'A#m/maj7', 'Caug7', 'Daug7', 'Eaug7', 'Faug7', 'Gaug7', 'Aaug7', 'Baug7', 'C#aug7', 'D#aug7', 'F#aug7', 'G#aug7', 'A#aug7', 'Cdim7', 'Ddim7', 'Edim7', 'Fdim7', 'Gdim7', 'Adim7', 'Bdim7', 'C#dim7', 'D#dim7', 'F#dim7', 'G#dim7', 'A#dim7', 'C7sus4', 'D7sus4', 'E7sus4', 'F7sus4', 'G7sus4', 'A7sus4', 'B7sus4', 'C#7sus4', 'D#7sus4', 'F#7sus4', 'G#7sus4', 'A#7sus4'])
]

# SQL生成
print("-- ファンタジーモードBASICステージ6-10を追加")
print("INSERT INTO fantasy_stages (")
print("  stage_number, name, description, max_hp, question_count, enemy_gauge_seconds,")
print("  mode, allowed_chords, chord_progression, bgm_url, show_guide, enemy_count,")
print("  enemy_hp, min_damage, max_damage, simultaneous_monster_count, stage_tier,")
print("  usage_type, is_sheet_music_mode, required_clears_for_next")
print(") VALUES")

values = []
for i, (stage_number, name, description, chords) in enumerate(stages_data):
    chord_objects = create_chord_objects(chords)
    chord_array = f"jsonb_build_array({', '.join(chord_objects)})"

    bgm_url = bgm_urls[i % len(bgm_urls)]  # 4つのURLを順番に割り当て

    value = f"('{stage_number}', '{name}', '{description}', 5, 10, 5.0, 'single', {chord_array}, '[]'::jsonb, '{bgm_url}', false, 1, 5, 1, 1, 1, 'basic', 'fantasy', false, 5)"
    values.append(value)

print(",\n".join(values))
print(";")