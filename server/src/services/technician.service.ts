import { Issue } from '../models/index.js'

export async function getAssignedIssues(technicianId: string) {
    const issues = await Issue.find({ technicianId })
    .populate('reporterId', 'name email')
    .populate('categoryId', 'name')
    .sort({ createdAt: -1 })

    return issues.map((issue) => {
        const data = issue.toJSON() as Record<string, any>

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            location: data.location,
            status: data.status,
            priority: data.priority,
            reporter: data.reporterId,
            category: data.categoryId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        }
    })
}