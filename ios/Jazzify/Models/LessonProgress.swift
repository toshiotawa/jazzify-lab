import Foundation

struct LessonProgressRow: Codable, Sendable {
    let id: UUID
    let userId: UUID
    let lessonId: UUID
    let courseId: UUID
    let completed: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case lessonId = "lesson_id"
        case courseId = "course_id"
        case completed
    }
}
