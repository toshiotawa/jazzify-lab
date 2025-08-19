#!/usr/bin/env python3
import re

# ファイルを読み込む
with open('/workspace/src/components/guild/GuildPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. ギルドボーナス説明UIにisMember条件を追加
content = re.sub(
    r'(<div className="text-sm text-green-400 mt-1">ギルドボーナス:.*?</div>)',
    r'{isMember && (\n                      \1\n                    )}',
    content,
    flags=re.DOTALL
)

# 2. 他人のギルドページに人数表示を追加
# isMemberでない場合にメンバー数を表示
add_member_count = '''                    {!isMember && (
                      <div className="text-sm text-gray-300 mt-1">メンバー数: {members.length}/5名</div>
                    )}'''

# Lv.{guild.level}の後に追加
content = re.sub(
    r'(<div className="text-sm text-gray-300 mt-1">Lv\.{guild\.level}</div>)',
    r'\1\n' + add_member_count,
    content
)

# 3. ギルドクエストUIにisMember条件を追加
content = re.sub(
    r'({guild\.guild_type === \'challenge\' && \()',
    r'{isMember && guild.guild_type === \'challenge\' && (',
    content
)

# 4. メンバーリストUIにisMember条件を追加
content = re.sub(
    r'(<div className="bg-slate-800 border border-slate-700 rounded p-4">\s*<h3 className="font-semibold mb-3">メンバーリスト)',
    r'{isMember && (\n                \1',
    content,
    flags=re.DOTALL
)

# メンバーリストの閉じタグも修正
content = re.sub(
    r'(</ul>\s*\)\s*\}\s*</div>)(\s*</>)',
    r'\1\n                </div>\n              )}\2',
    content,
    flags=re.DOTALL
)

# ファイルに書き戻す
with open('/workspace/src/components/guild/GuildPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("修正完了")