"""Emit SQL updates for Japanese tutorial course lesson title_en / description_en."""
from __future__ import annotations

# (id, title_en, description_en) — チュートリアルは5レッスン（20260402190000 と同期）
# body uses plain newlines; script wraps in dollar quotes
LESSONS: list[tuple[str, str, str]] = [
    (
        "dcabffbf-acbc-4cb2-9ba9-f856fbf72f01",
        "About Jazzify",
        """Welcome to Jazzify!

Jazzify is a music learning app designed around the concept of "learning jazz while having fun." It helps you practice piano and guitar with a gamified approach.

There are three ways to input your performance:

MIDI Keyboard
Connect a CoreMIDI-compatible keyboard or controller to your iPhone. This method offers the lowest latency and most accurate input. Connection instructions are covered in the last step of this tutorial.

Microphone Pitch Detection
Uses your iPhone's microphone to detect pitch in real time. Ideal for acoustic instruments or vocal practice. Microphone permission will be requested on first use.

On-Screen Piano Keys
Tap the piano keys on screen to play without any external device. Convenient when you want to get started quickly.

Your performance is scored in real time against the musical score, with timing and pitch accuracy shown as a score. The app is structured for learners at every level to set goals and track progress.

This tutorial has five steps. Tap "Complete lesson" at the bottom of each page to continue.""",
    ),
    (
        "2027ff4d-5bc0-44fc-aeb0-50e28870ecb2",
        "Premium Plan",
        """Jazzify offers a Premium subscription plan.

What's Included
With Premium, you unlock:
- All lesson courses beyond the Tutorial
- Full access to Survival mode stages
- All Daily Challenge difficulty levels
- Detailed statistics and progress tracking

Free users can access only the Tutorial course and the lowest Daily Challenge difficulty.

7-Day Free Trial
First-time users can enjoy a 7-day free trial. During the trial, all Premium features are available. Charges begin automatically after the trial ends.

Cancel Anytime
Premium is a monthly auto-renewing subscription. You can cancel at any time\u2014just cancel at least 24 hours before the current period ends to avoid the next charge.

To cancel: Settings \u2192 Apple ID \u2192 Subscriptions""",
    ),
    (
        "b7309196-3083-4f4e-b57e-1d5c2027b5ac",
        "Survival Mode",
        """Survival mode is an action-packed mode designed to help you learn chords in an engaging way.

Purpose \u2014 Learn Chords Through Practice
In Survival mode, enemies approach and you must input the correct chord to trigger skills and defeat them. Through repeated play, you will naturally memorize chord voicings and structures. This mode aims to build practical chord knowledge that is hard to gain from study alone.

How to Play
Enemies move toward your character on the field. A chord name is displayed on screen (e.g., Cmaj7, Dm7). Input the matching chord using a MIDI keyboard, microphone, or on-screen piano keys. Accurate input activates a skill that damages enemies.

Clear Conditions
Survive for a set duration or achieve specific objectives to clear a stage. Getting hit by enemies reduces your health\u2014when it reaches zero, it is game over.""",
    ),
    (
        "71ad6e11-5f98-4c0c-b955-be0352ad20ad",
        "How Lessons Work",
        """The Lessons tab organizes learning materials into courses. Select a course and work through its lessons one by one.

Purpose
Lessons provide a structured way to learn jazz theory and performance techniques. With real-time scoring feedback, you can gradually improve your timing and pitch accuracy.

Blocks and Assignments
Lessons are grouped into "blocks" by topic. Complete all lessons in a block to unlock the next one.

Some lessons include "assignments." In assignments, you play along with scrolling notes and receive a performance score. It is most effective to study the lesson content before attempting the assignment.

Course Overview
Beyond the Tutorial, courses are available ranging from beginner-friendly to more advanced topics. After completing the Tutorial, you can access other courses with a Premium plan.

New courses are added regularly. Check the Announcements page for the latest additions.""",
    ),
    (
        "a8d86a15-0a62-49cc-b894-07eb530eb91a",
        "How to Connect a MIDI Keyboard",
        """Connecting a MIDI keyboard (digital piano) to your iPhone enables a more authentic practice experience. Here is how to set it up.

For iPhones with a Lightning Port
A Lightning to USB Camera Adapter (Apple genuine) is required. Connect in this order:

Summary: iPhone \u2014 Camera Adapter \u2014 Cable (Type-A \u2194 Type-B) \u2014 MIDI Keyboard

For iPhones or iPads with a USB Type-C Port
With a Type-C iPhone, you may not need a camera adapter.

Option 1 (Type-C to Type-B cable):
iPhone \u2014 Cable (Type-C \u2194 Type-B) \u2014 MIDI Keyboard

Option 2 (Type-A to Type-B cable):
iPhone \u2014 Type-C Hub \u2014 Cable (Type-A \u2194 Type-B) \u2014 MIDI Keyboard

Choose the cable that matches the port on your MIDI keyboard.

Connection Tips
- Make sure your MIDI keyboard is powered on.
- The app will automatically detect the MIDI device once connected.
- If the connection does not work, try reconnecting the cable or restarting the app.

This concludes the tutorial! Tap "Complete lesson" to start learning jazz.""",
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
