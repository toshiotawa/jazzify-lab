"""Emit SQL updates for Japanese tutorial course lesson title_en / description_en."""
from __future__ import annotations

# (id, title_en, description_en) — body uses plain newlines; script wraps in dollar quotes
LESSONS: list[tuple[str, str, str]] = [
    (
        "dcabffbf-acbc-4cb2-9ba9-f856fbf72f01",
        "Getting started with Jazzify",
        """Welcome to Jazzify!

This tutorial walks you through the app step by step. Finish it and you will know how every major feature fits together.

If you are unsure where to begin, do not worry—we guide you one screen at a time and help you find a jazz-learning path that suits you.

Scroll to the bottom of this page and tap “Complete lesson” to continue.""",
    ),
    (
        "71ad6e11-5f98-4c0c-b955-be0352ad20ad",
        "About the lesson feature",
        """The page you are viewing is the Lessons area. You are currently in the Tutorial course.

Courses: Jazzify offers many courses (music theory, blues, solo piano, jazz piano foundations, voicings, improvisation, and more).

Each course chains lesson tasks so you can study jazz in a structured way—pick courses that match your level and interests.

Plan limits:
• Standard: Tutorial course only
• Premium and above: all courses

Open the lesson list from the links below.""",
    ),
    (
        "2027ff4d-5bc0-44fc-aeb0-50e28870ecb2",
        "About blocks",
        """Lessons are grouped into blocks by topic.

How blocks work: clear every lesson inside a block to unlock the next block automatically.

Manual block unlock (Platinum / Black): you may unlock blocks without finishing prior lessons.
• Each billing cycle grants points to unlock up to 10 blocks
• Great if you want to jump ahead

Downgrade note: if you move below Premium, manually unlocked blocks lock again. Re-upgrading to Platinum/Black restores those unlocks.

The next lesson explains subscription plans.""",
    ),
    (
        "b7309196-3083-4f4e-b57e-1d5c2027b5ac",
        "About plans",
        """Jazzify has five plans.

• Free: account-only “sleep” mode—no games or learning features
• Standard: Tutorial, Fantasy mode, Survival (some characters), Legend (5 songs)
• Premium: every course and mode
• Platinum: Premium plus perks such as manual block unlock
• Black: top tier with the largest perks plus lesson feedback/review

Free still keeps your profile and history so you can return anytime.

Compare plans: https://jazzify.jp/main#plan-comparison

Billing renews monthly on your signup day (check Account for the next date).

Plan changes: upgrades apply immediately; downgrades keep current features until the period ends.

Change plans from your account page.""",
    ),
    (
        "ebe15e56-182f-44f3-93e1-cd2edc467090",
        "About the free trial",
        """Jazzify includes a one-week free trial.

During the trial you can try every plan, switch between them freely, and use all features.

When the trial ends, billing starts for whichever plan you selected.

You may cancel during the trial. Enjoy exploring! The next lesson covers the XP system.""",
    ),
    (
        "aee9aaa7-eb2d-4de9-823d-cf562fa61573",
        "About experience points",
        """Jazzify uses RPG-style experience points.

Earn XP by playing games (Fantasy, Legend, etc.), writing diary entries, and clearing missions.

Level up as you earn XP—think of it as growing your character while you learn jazz.

Check levels on the Dashboard and ranking screens. Compete with friends for extra motivation.

Use the links below to open Dashboard or Rankings.""",
    ),
    (
        "ea12a234-9c38-4bb8-9115-6ca4652313ba",
        "About rankings",
        """Compete in multiple ranking categories:

• Level: total XP—shows how much you have played overall
• Lessons: completed lesson count (this tutorial counts!)
• Missions: mission clears (details in a later lesson)
• Fantasy: cleared Fantasy stages
• Survival: best survival time across characters/difficulties
• Daily Challenge: high scores per difficulty tier

Tap a username to view profiles and diaries. Aim for the top!

Open Rankings from the link below.""",
    ),
    (
        "4f7d86d7-7a9a-41cc-bf77-2bc9b97b2121",
        "Diary",
        """Write one diary entry per day, browse others’ posts, like and comment respectfully.

Try introducing yourself or sharing your Jazzify goals, then tap “Complete lesson.”

Open Diary from the link below.""",
    ),
    (
        "c33b8492-5545-4685-9023-b7c0adb6ec02",
        "Missions",
        """Weekly and monthly missions reward bonus XP for clearing specific tasks.

Types include songs, Fantasy stages, diary posts, and more.

If you already wrote a diary, check Missions for related rewards.

Claim rewards, then tap “Complete lesson.” Open Missions from the link below.""",
    ),
    (
        "15db73a4-03e4-4c8a-9116-08d547ef7941",
        "Announcements",
        """Read release notes, maintenance windows, events, and other important news.

Highlights also appear on the Dashboard; the Announcements page lists the full history.

Check back regularly via the link below.""",
    ),
    (
        "3fb33a38-3efd-4ed2-8698-c6ad76aad9c4",
        "About Fantasy mode",
        """Fantasy mode is an RPG-style way to learn jazz.

Three tracks:
• BASIC: reading notes, solfège, fundamentals
• ADVANCED: practical progressions and voicings
• Phrases: classic jazz vocabulary

Gameplay: reduce every monster’s “hostility” HP before yours hits zero by playing the shown notes or chords. Clearing a stage unlocks the next.

Try BASIC 1-1, then tap “Complete lesson.”""",
    ),
    (
        "22afd82f-4041-48da-a215-fe5020f1ed3b",
        "Connecting a MIDI keyboard",
        """Quit other MIDI apps (Logic, GarageBand, Dorico, MuseScore, etc.) before connecting.

Steps:
1. Open Fantasy BASIC 1-2 and choose Practice
2. Tap the gear icon → MIDI devices
3. Select your hardware
4. Play keys—audio input confirms success

Troubleshooting: set device to None, then re-select; restart the browser or device if needed.

iOS: Safari/Chrome lack Web MIDI—use the “WEB MIDI Browser” app to open Jazzify.

Try clearing BASIC 1-2 on MIDI, then tap “Complete lesson.”""",
    ),
    (
        "94491b06-779e-416e-afb1-a68346de06f2",
        "Fantasy stage types",
        """Quiz type: answer chords/notes before the enemy attack gauge fills—speed and accuracy matter.

Rhythm type: play in time with the BGM like a rhythm game—better timing deals more damage.

BASIC 1-3 is rhythm type. Compare it with quiz stages, clear it, then continue.""",
    ),
    (
        "c9e4f6c0-5b80-415d-9129-4a36a2568532",
        "Fantasy (Phrases)",
        """The Phrases track teaches real jazz vocabulary in short loops.

Use Practice mode to slow playback, learn fingerings, then move to Challenge for clears.

Open Fantasy → Phrases → 1-1, play, and tap “Complete lesson.”""",
    ),
    (
        "adbe8a03-9b34-42b8-bde3-64b97895138b",
        "Daily Challenge",
        """Two-minute Fantasy quiz sprint—how many correct answers can you score?

Five difficulties from ultra-beginner to pro.

Scores log once per day per tier; review history on the Dashboard.

Try Ultra Beginner, then tap “Complete lesson.” Check Rankings for your records.""",
    ),
    (
        "92053bff-b980-49c0-b0fb-bdcb59d85a95",
        "About titles",
        """Earn display titles for milestones (level, missions, lessons, Fantasy progress).

Set your title on the Account page; it appears on rankings and profiles.

If you unlocked the 11-lesson completion title, try equipping it, then tap “Complete lesson.”""",
    ),
    (
        "3009c97e-6f41-4dc6-8f58-a043f0dd7895",
        "Legend mode",
        """Legend mode is free play on your favorite songs.

• Rehearsal: tempo, loops, keyboard highlights, autoplay, timing offset
• Stage: full run-through with fixed tempo and scoring

Try “Invention No.1 C Major” in rehearsal at 50% speed with keyboard highlight + autoplay. Adjust the timing slider if video/audio feels offset.

Tap “Complete lesson” when done. The next lesson introduces Survival mode.""",
    ),
    (
        "33833110-1c0e-4045-aa1b-430c92df6e05",
        "Survival mode",
        """Survival is an action mode: move on the field, defeat enemies, and survive as long as you can.

Skill slots A–B–C–D show chords to play; correct input fires the matching skill.

Gain XP from coins; survive wave events every minute; at level-up pick bonuses by playing the shown chords (or use Auto-Pick where available).

Characters have unique traits; Premium+ unlocks beyond the default hero.

Difficulty changes chord complexity and XP rewards.

Rankings track best time per character and tier.

Try Very Easy with Fai and survive two minutes, then tap “Complete lesson.” This is the final tutorial lesson—welcome to Jazzify!""",
    ),
]


def main() -> None:
    print("BEGIN;\n")
    print("-- 日本向けチュートリアルコース (audience japan) の英語列")
    for i, (uid, title_en, body) in enumerate(LESSONS):
        tag = f"t{i}"
        esc_title = title_en.replace("'", "''")
        print(
            f"UPDATE lessons SET title_en = '{esc_title}', description_en = ${tag}${body}${tag}$ "
            f"WHERE id = '{uid}'::uuid;\n",
        )
    print("COMMIT;\n")


if __name__ == "__main__":
    main()
