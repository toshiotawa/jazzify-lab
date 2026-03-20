"""One-off helper: prints VALUES rows for lesson title_en updates (Survival course)."""
from __future__ import annotations

ROWS: list[tuple[str, str]] = [
    ("26e0b23b-4ef0-4ce6-b8e9-94119c3452b0", "White-key note quiz"),
    ("7925fabc-c3a1-4acd-af82-a9401a050365", "Major triads (root position)"),
    ("c52b70c0-e3e0-43fc-a4f2-c483dee06d24", "Minor triads (root position)"),
    ("f9e45ab2-7393-47dc-bf48-054efd590ca5", "Easy review: all-keys quiz"),
    ("fa79e6cc-67ae-459c-bf49-47b5825eede0", "Major 7th (root position)"),
    ("cebf5df8-9c4d-478f-a820-f811261a90ce", "Minor 7th (root position)"),
    ("22edede6-a0ca-4c9d-bf1d-4ff1fb3ca878", "Dominant 7th (root position)"),
    ("82cc0ebf-00c8-40fa-9365-12d2db0fd8a0", "Half-diminished 7th (root position)"),
    ("842200f2-993a-451e-929f-a5fc71af2e8a", "Minor–major 7th (root position)"),
    ("8516d488-571f-41c8-b659-96054fbd1570", "Diminished 7th (root position)"),
    ("bf35f6c6-26ce-4127-9293-15d38dad8408", "Augmented 7th (root position)"),
    ("0889543e-39f3-4988-b84a-7ee50527bf7a", "Major 6th (root position)"),
    ("659bd4c0-9662-449e-b827-b1ce468a6500", "Minor 6th (root position)"),
    ("825f5887-3815-4708-8555-952f10bb8b57", "Normal review: all-keys quiz"),
    ("41dbd6e6-fd60-4f36-a1aa-a6c2dc9a4196", "Maj7(9) form A"),
    ("c9d4ff24-8b47-4dd6-a1c8-019febede704", "m7(9) form A"),
    ("5e81f0f7-fdd2-4bc5-bdd1-3fc3799ff1a6", "7(9,13) form A"),
    ("143b565d-f594-4cf1-bbfd-0987550ecded", "7(♭9,♭13) form A"),
    ("5a127203-ff3c-4d68-8052-04d748b81117", "6(9) form A"),
    ("5e8ca6d1-1c5f-4835-89a8-8c244f4d0b18", "m6(9) form A"),
    ("8d82710b-f6f2-4d56-a206-48d99b79f946", "Hard review: all-keys quiz"),
    ("505b8c8b-bb6c-4572-aba4-7b2e17af331f", "7(♭9,13) form A"),
    ("df178d1f-8b0e-41a8-a770-898726eda2c6", "7(♯9,♭13) form A"),
    ("f9168734-5cb4-4403-b69c-dae64a60de18", "m7(♭5)(11) form A"),
    ("178a7f83-4178-4e6c-9739-55b13da2a7c9", "dim(maj7) form A"),
    ("18fe8d0d-e8e1-491d-9dc4-76bb8d4c56a5", "Extreme review: all-keys quiz"),
    ("234818d1-2ba9-4e47-a414-ed43e7561570", "Sharp & flat note quiz"),
    ("b2942dde-c611-4dce-85c4-e745d64b1fc1", "Major triads (1st inversion)"),
    ("34a9cc53-5973-4b5f-b8c7-296eb412bdae", "Minor triads (1st inversion)"),
    ("1563be5d-8934-47a5-a411-da76e0a20460", "Major 7th (1st inversion)"),
    ("7067219b-a334-433f-8b11-3c1c981d391e", "Minor 7th (1st inversion)"),
    ("b6f8b667-9c88-4461-9443-708340f047e6", "Dominant 7th (1st inversion)"),
    ("9dd5709f-5081-4a05-9f17-664f9db9e4fb", "Half-diminished 7th (1st inversion)"),
    ("d450118a-30cf-4b5e-8eaf-5f84c520782b", "Minor–major 7th (1st inversion)"),
    ("5f4bb932-fa72-4447-b25b-312fd58f8c52", "Diminished 7th (1st inversion)"),
    ("882d9ab9-88a8-4b5a-8d6f-f1d40a7cfb72", "Augmented 7th (1st inversion)"),
    ("06c6b196-6961-4f4f-b33d-4e0b15d8333e", "Major 6th (1st inversion)"),
    ("1f84e4e1-b379-402a-b7d0-fe1cee1f8581", "Minor 6th (1st inversion)"),
    ("7d173ba7-3a46-425f-8ca1-ef9be91b3725", "Maj7(9) form B"),
    ("fd56525e-b11c-4375-a3b0-58b4fbb9d520", "m7(9) form B"),
    ("e99637a8-6a5b-4630-9314-60a78919fc24", "7(9,13) form B"),
    ("0de0e8e5-386f-47ac-bcea-3ddbeeaba50a", "7(♭9,♭13) form B"),
    ("9da74b66-7428-48de-bea9-8adacb402575", "6(9) form B"),
    ("c3eb4d38-8446-4511-aa54-a275a3373d06", "m6(9) form B"),
    ("34bb9487-c408-4874-8df2-a51db626f51e", "7(♭9,13) form B"),
    ("cb727098-312c-4d63-ac83-43576195a660", "7(♯9,♭13) form B"),
    ("6666fb35-6d71-4f10-a45b-a037bab529d8", "m7(♭5)(11) form B"),
    ("5a3adb6a-0a4d-4fd7-abad-4b350f9e7d27", "dim(maj7) form B"),
    ("bdc448e1-f4e7-4bf1-af5d-b83352441e15", "All 12 notes quiz"),
    ("c5a88d4f-02c6-442a-bbd7-9165ebb2ce8f", "Major triads (2nd inversion)"),
    ("3a678132-0cef-4f88-9f7e-b71758c916f6", "Minor triads (2nd inversion)"),
    ("fb3c3f04-e35f-440d-a1a3-a69d491529d8", "Major 7th (2nd inversion)"),
    ("3a79a6a2-8e2e-4c19-8652-7b77d171c240", "Minor 7th (2nd inversion)"),
    ("b58993ef-5930-4f3f-a21b-1664658eebba", "Dominant 7th (2nd inversion)"),
    ("c1148792-b236-45be-8f10-cc5f26ded3e7", "Half-diminished 7th (2nd inversion)"),
    ("bc8c8b9a-fca8-429a-bc25-61a0ef53e5bb", "Minor–major 7th (2nd inversion)"),
    ("0b7ef29e-0adc-4104-aaef-b02c48d02f18", "Diminished 7th (2nd inversion)"),
    ("1c19291f-06aa-4568-8996-5daa8f530319", "Augmented 7th (2nd inversion)"),
    ("02e53d49-0d5c-46d5-9c4b-517b50d6f687", "Major 6th (2nd inversion)"),
    ("361b419b-1ebe-4c09-bacf-7e968fd27e0a", "Minor 6th (2nd inversion)"),
    ("dd66a95f-eb2c-43e0-9629-614e19966dba", "Major 7th (3rd inversion)"),
    ("b367e5da-3be2-4329-8eb5-504b5e340d20", "Minor 7th (3rd inversion)"),
    ("474846ba-1468-4f61-8695-a4cb307a7a01", "Dominant 7th (3rd inversion)"),
    ("0a7509d4-8911-4d56-bc9f-e8739de1c9d9", "Half-diminished 7th (3rd inversion)"),
    ("44aee589-b31d-435f-a1f2-f37f8987bea7", "Minor–major 7th (3rd inversion)"),
    ("091b16c1-f027-45b0-bd5e-304f03edb51c", "Diminished 7th (3rd inversion)"),
    ("c78b3235-e996-4475-9d79-19c993866eea", "Augmented 7th (3rd inversion)"),
    ("5c58da59-5535-4d50-8d9b-876b4085e284", "Major 6th (3rd inversion)"),
    ("07ae1a81-49ea-4c94-bdfe-bf3c73685c2b", "Minor 6th (3rd inversion)"),
]


def main() -> None:
    parts: list[str] = []
    for i, (uid, title) in enumerate(ROWS):
        esc = title.replace("'", "''")
        suffix = "," if i < len(ROWS) - 1 else ""
        parts.append(f"  ('{uid}'::uuid, '{esc}'){suffix}")
    print("\n".join(parts))


if __name__ == "__main__":
    main()
