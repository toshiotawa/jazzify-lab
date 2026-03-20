-- MCP取得IDに基づくレッスン英語列（title_en / description_en）
-- 対象: global Tutorial コピー、サバイバル徹底攻略、音符の読み方

BEGIN;

-- グローバル「Tutorial」コースは既に英語本文のため英語列に複製
UPDATE lessons
SET title_en = title, description_en = description
WHERE course_id = 'b0000000-0000-0000-0000-000000000001';

-- サバイバル: 共通ドリル説明（多数レッスンで同一 description）
UPDATE lessons SET description_en = $en$
C–E: in order
C–E: rhythm
C–E: quiz
F–B: in order
F–B: rhythm
F–B: quiz
White keys: in order
White keys: rhythm
♭ roots: in order
♭ roots: rhythm
♭ roots: quiz
♯ roots: in order
♯ roots: rhythm
♯ roots: quiz
Chromatic up/down: rhythm
Chromatic up/down: in order
All-keys quiz
$en$
WHERE course_id = '95cf6992-e987-4235-b8e2-03fe1bad8a00'
AND description = $ja$
CDE 順番
CDE リズム
CDE クイズ
FGAB 順番
FGAB リズム
FGAB クイズ
白鍵 順番
白鍵 リズム
♭ルート 順番
♭ルート リズム
♭ルート クイズ
♯ルート 順番
♯ルート リズム
♯ルート クイズ
半音での上昇下降 リズム
半音での上昇下降 順番
全キークイズ
$ja$;

UPDATE lessons SET description_en = 'Quiz on random white-key notes.'
WHERE course_id = '95cf6992-e987-4235-b8e2-03fe1bad8a00' AND description = '白鍵の音をランダムに当てよう';

UPDATE lessons SET description_en = 'Quiz on random sharp and flat notes.'
WHERE course_id = '95cf6992-e987-4235-b8e2-03fe1bad8a00' AND description = '♯と♭の音をランダムに当てよう';

UPDATE lessons SET description_en = 'Quiz on all 12 chromatic notes at random.'
WHERE course_id = '95cf6992-e987-4235-b8e2-03fe1bad8a00' AND description = '12音すべてをランダムに当てよう';

UPDATE lessons SET description_en = 'Quiz covering every Easy-tier chord type in all keys.'
WHERE course_id = '95cf6992-e987-4235-b8e2-03fe1bad8a00' AND description = 'Easyの全コードをクイズに出題します。';

UPDATE lessons SET description_en = 'Quiz covering every Normal-tier chord type in all keys.'
WHERE course_id = '95cf6992-e987-4235-b8e2-03fe1bad8a00' AND description = 'Normalの全コードをクイズに出題します。';

UPDATE lessons SET description_en = 'Quiz covering every Hard-tier chord type in all keys.'
WHERE course_id = '95cf6992-e987-4235-b8e2-03fe1bad8a00' AND description = 'Hardの全コードをクイズに出題します。';

UPDATE lessons SET description_en = 'Quiz covering every Extreme-tier chord type in all keys.'
WHERE course_id = '95cf6992-e987-4235-b8e2-03fe1bad8a00' AND description = 'Extremeの全コードをクイズに出題します。';

UPDATE lessons AS l SET title_en = v.title_en
FROM (VALUES
  ('26e0b23b-4ef0-4ce6-b8e9-94119c3452b0'::uuid, 'White-key note quiz'),
  ('7925fabc-c3a1-4acd-af82-a9401a050365'::uuid, 'Major triads (root position)'),
  ('c52b70c0-e3e0-43fc-a4f2-c483dee06d24'::uuid, 'Minor triads (root position)'),
  ('f9e45ab2-7393-47dc-bf48-054efd590ca5'::uuid, 'Easy review: all-keys quiz'),
  ('fa79e6cc-67ae-459c-bf49-47b5825eede0'::uuid, 'Major 7th (root position)'),
  ('cebf5df8-9c4d-478f-a820-f811261a90ce'::uuid, 'Minor 7th (root position)'),
  ('22edede6-a0ca-4c9d-bf1d-4ff1fb3ca878'::uuid, 'Dominant 7th (root position)'),
  ('82cc0ebf-00c8-40fa-9365-12d2db0fd8a0'::uuid, 'Half-diminished 7th (root position)'),
  ('842200f2-993a-451e-929f-a5fc71af2e8a'::uuid, 'Minor–major 7th (root position)'),
  ('8516d488-571f-41c8-b659-96054fbd1570'::uuid, 'Diminished 7th (root position)'),
  ('bf35f6c6-26ce-4127-9293-15d38dad8408'::uuid, 'Augmented 7th (root position)'),
  ('0889543e-39f3-4988-b84a-7ee50527bf7a'::uuid, 'Major 6th (root position)'),
  ('659bd4c0-9662-449e-b827-b1ce468a6500'::uuid, 'Minor 6th (root position)'),
  ('825f5887-3815-4708-8555-952f10bb8b57'::uuid, 'Normal review: all-keys quiz'),
  ('41dbd6e6-fd60-4f36-a1aa-a6c2dc9a4196'::uuid, 'Maj7(9) form A'),
  ('c9d4ff24-8b47-4dd6-a1c8-019febede704'::uuid, 'm7(9) form A'),
  ('5e81f0f7-fdd2-4bc5-bdd1-3fc3799ff1a6'::uuid, '7(9,13) form A'),
  ('143b565d-f594-4cf1-bbfd-0987550ecded'::uuid, '7(♭9,♭13) form A'),
  ('5a127203-ff3c-4d68-8052-04d748b81117'::uuid, '6(9) form A'),
  ('5e8ca6d1-1c5f-4835-89a8-8c244f4d0b18'::uuid, 'm6(9) form A'),
  ('8d82710b-f6f2-4d56-a206-48d99b79f946'::uuid, 'Hard review: all-keys quiz'),
  ('505b8c8b-bb6c-4572-aba4-7b2e17af331f'::uuid, '7(♭9,13) form A'),
  ('df178d1f-8b0e-41a8-a770-898726eda2c6'::uuid, '7(♯9,♭13) form A'),
  ('f9168734-5cb4-4403-b69c-dae64a60de18'::uuid, 'm7(♭5)(11) form A'),
  ('178a7f83-4178-4e6c-9739-55b13da2a7c9'::uuid, 'dim(maj7) form A'),
  ('18fe8d0d-e8e1-491d-9dc4-76bb8d4c56a5'::uuid, 'Extreme review: all-keys quiz'),
  ('234818d1-2ba9-4e47-a414-ed43e7561570'::uuid, 'Sharp & flat note quiz'),
  ('b2942dde-c611-4dce-85c4-e745d64b1fc1'::uuid, 'Major triads (1st inversion)'),
  ('34a9cc53-5973-4b5f-b8c7-296eb412bdae'::uuid, 'Minor triads (1st inversion)'),
  ('1563be5d-8934-47a5-a411-da76e0a20460'::uuid, 'Major 7th (1st inversion)'),
  ('7067219b-a334-433f-8b11-3c1c981d391e'::uuid, 'Minor 7th (1st inversion)'),
  ('b6f8b667-9c88-4461-9443-708340f047e6'::uuid, 'Dominant 7th (1st inversion)'),
  ('9dd5709f-5081-4a05-9f17-664f9db9e4fb'::uuid, 'Half-diminished 7th (1st inversion)'),
  ('d450118a-30cf-4b5e-8eaf-5f84c520782b'::uuid, 'Minor–major 7th (1st inversion)'),
  ('5f4bb932-fa72-4447-b25b-312fd58f8c52'::uuid, 'Diminished 7th (1st inversion)'),
  ('882d9ab9-88a8-4b5a-8d6f-f1d40a7cfb72'::uuid, 'Augmented 7th (1st inversion)'),
  ('06c6b196-6961-4f4f-b33d-4e0b15d8333e'::uuid, 'Major 6th (1st inversion)'),
  ('1f84e4e1-b379-402a-b7d0-fe1cee1f8581'::uuid, 'Minor 6th (1st inversion)'),
  ('7d173ba7-3a46-425f-8ca1-ef9be91b3725'::uuid, 'Maj7(9) form B'),
  ('fd56525e-b11c-4375-a3b0-58b4fbb9d520'::uuid, 'm7(9) form B'),
  ('e99637a8-6a5b-4630-9314-60a78919fc24'::uuid, '7(9,13) form B'),
  ('0de0e8e5-386f-47ac-bcea-3ddbeeaba50a'::uuid, '7(♭9,♭13) form B'),
  ('9da74b66-7428-48de-bea9-8adacb402575'::uuid, '6(9) form B'),
  ('c3eb4d38-8446-4511-aa54-a275a3373d06'::uuid, 'm6(9) form B'),
  ('34bb9487-c408-4874-8df2-a51db626f51e'::uuid, '7(♭9,13) form B'),
  ('cb727098-312c-4d63-ac83-43576195a660'::uuid, '7(♯9,♭13) form B'),
  ('6666fb35-6d71-4f10-a45b-a037bab529d8'::uuid, 'm7(♭5)(11) form B'),
  ('5a3adb6a-0a4d-4fd7-abad-4b350f9e7d27'::uuid, 'dim(maj7) form B'),
  ('bdc448e1-f4e7-4bf1-af5d-b83352441e15'::uuid, 'All 12 notes quiz'),
  ('c5a88d4f-02c6-442a-bbd7-9165ebb2ce8f'::uuid, 'Major triads (2nd inversion)'),
  ('3a678132-0cef-4f88-9f7e-b71758c916f6'::uuid, 'Minor triads (2nd inversion)'),
  ('fb3c3f04-e35f-440d-a1a3-a69d491529d8'::uuid, 'Major 7th (2nd inversion)'),
  ('3a79a6a2-8e2e-4c19-8652-7b77d171c240'::uuid, 'Minor 7th (2nd inversion)'),
  ('b58993ef-5930-4f3f-a21b-1664658eebba'::uuid, 'Dominant 7th (2nd inversion)'),
  ('c1148792-b236-45be-8f10-cc5f26ded3e7'::uuid, 'Half-diminished 7th (2nd inversion)'),
  ('bc8c8b9a-fca8-429a-bc25-61a0ef53e5bb'::uuid, 'Minor–major 7th (2nd inversion)'),
  ('0b7ef29e-0adc-4104-aaef-b02c48d02f18'::uuid, 'Diminished 7th (2nd inversion)'),
  ('1c19291f-06aa-4568-8996-5daa8f530319'::uuid, 'Augmented 7th (2nd inversion)'),
  ('02e53d49-0d5c-46d5-9c4b-517b50d6f687'::uuid, 'Major 6th (2nd inversion)'),
  ('361b419b-1ebe-4c09-bacf-7e968fd27e0a'::uuid, 'Minor 6th (2nd inversion)'),
  ('dd66a95f-eb2c-43e0-9629-614e19966dba'::uuid, 'Major 7th (3rd inversion)'),
  ('b367e5da-3be2-4329-8eb5-504b5e340d20'::uuid, 'Minor 7th (3rd inversion)'),
  ('474846ba-1468-4f61-8695-a4cb307a7a01'::uuid, 'Dominant 7th (3rd inversion)'),
  ('0a7509d4-8911-4d56-bc9f-e8739de1c9d9'::uuid, 'Half-diminished 7th (3rd inversion)'),
  ('44aee589-b31d-435f-a1f2-f37f8987bea7'::uuid, 'Minor–major 7th (3rd inversion)'),
  ('091b16c1-f027-45b0-bd5e-304f03edb51c'::uuid, 'Diminished 7th (3rd inversion)'),
  ('c78b3235-e996-4475-9d79-19c993866eea'::uuid, 'Augmented 7th (3rd inversion)'),
  ('5c58da59-5535-4d50-8d9b-876b4085e284'::uuid, 'Major 6th (3rd inversion)'),
  ('07ae1a81-49ea-4c94-bdfe-bf3c73685c2b'::uuid, 'Minor 6th (3rd inversion)')
) AS v(id, title_en)
WHERE l.id = v.id;

-- 音符の読み方
UPDATE lessons SET title_en = 'Treble clef: notes on the lines', description_en = $n1$
On the treble staff, notes sit on the five lines. From bottom to top:

• Line 1 = E4
• Line 2 = G4
• Line 3 = B4
• Line 4 = D5
• Line 5 = F5

Many English speakers memorize lines as “Every Good Boy Does Fine” (E, G, B, D, F). Master these five first.
$n1$
WHERE id = 'b5877bb5-eb6d-4a23-96d1-4bea60b76168';

UPDATE lessons SET title_en = 'Treble clef: notes in the spaces', description_en = $n2$
Between the treble staff lines, the spaces spell F–A–C–E upward (F4, A4, C5, E5). Together with the line notes, you can read every step inside the staff.
$n2$
WHERE id = 'f6f308ed-6ec1-4a48-9849-febdf4e55ec4';

UPDATE lessons SET title_en = 'Treble clef: ledger lines', description_en = $n3$
Notes outside the staff use ledger lines.

Below the staff: middle C (C4) sits one ledger line under the treble staff; A3 and B3 appear on further ledger lines below.

Above the staff: A5 uses one ledger line above; higher notes such as C6 add more ledger lines.

Ledger-line notes appear less often—practice until they feel natural.
$n3$
WHERE id = '7fadf14b-b8be-4dcc-b7ae-9fef250c820b';

UPDATE lessons SET title_en = 'Treble clef: sharps and flats', description_en = $n4$
♯ raises a note by a half step; ♭ lowers it by a half step. Accidentals appear to the left of the notehead on the same line or space.

Examples: F♯, C♯, G♯, B♭, E♭, A♭.

Reading ♯ and ♭ quickly is essential for real charts and lead sheets.
$n4$
WHERE id = '6c967b06-cecf-4e6f-996c-12f39a82a333';

UPDATE lessons SET title_en = 'Treble clef review', description_en = $n5$
Review everything on the treble staff: line notes, space notes, ledger lines, and accidentals. About 100 questions cover all 25 pitch types at random—finish this and your treble reading is solid.
$n5$
WHERE id = '95b6d06e-737c-4fb9-ad95-75ffbbc1c3fa';

UPDATE lessons SET title_en = 'Bass clef: notes on the lines', description_en = $n6$
The bass (F) clef notates lower pitches—common for piano left hand, bass, and cello.

Line notes from bottom to top: G2, B2, D3, F3, A3. English mnemonic: “Good Boys Do Fine Always” (G, B, D, F, A). The positions differ from treble clef—avoid mixing them up.
$n6$
WHERE id = 'caed5fea-bd28-4561-9a8f-cc5e90186c82';

UPDATE lessons SET title_en = 'Bass clef: notes in the spaces', description_en = $n7$
Bass staff spaces bottom to top: A2, C3, E3, G3. Mnemonic: “All Cows Eat Grass” (A, C, E, G). Combine with line notes to read the full staff interior.
$n7$
WHERE id = '735f6da2-3a73-4789-b98c-10ab1f9ed2af';

UPDATE lessons SET title_en = 'Bass clef: ledger lines', description_en = $n8$
Bass clef also uses ledger lines. E2 sits below the staff; middle C (C4) appears one ledger line above the bass staff.

Middle C is the bridge between treble (ledger below) and bass (ledger above) on the grand staff.
$n8$
WHERE id = 'f5413d02-495e-4768-ab56-a4934f3e7283';

UPDATE lessons SET title_en = 'Bass clef: sharps and flats', description_en = $n9$
Practice ♯ and ♭ in the bass register—critical for walking bass lines and left-hand parts. Rules match treble: ♯ up a half step, ♭ down a half step.
$n9$
WHERE id = 'ba24c1d2-7aec-4504-9297-63a516caf814';

UPDATE lessons SET title_en = 'Bass clef review', description_en = $n10$
Review bass staff lines (G2–A3), spaces (A2–G3), ledger notes (E2, F2, B3, C4), and accidentals—about 100 random questions across 23 pitch types.
$n10$
WHERE id = 'e9a02acf-65bf-4135-aa31-f22cf956f657';

UPDATE lessons SET title_en = 'Grand staff review', description_en = $n11$
Final drill: treble and bass combined. All 48 pitch types appear at random—train yourself to switch clefs instantly. Completing ~100 questions means your basic sight-reading is in good shape.
$n11$
WHERE id = '68015aa1-c57b-4dbf-8259-b57252caf865';

COMMIT;
