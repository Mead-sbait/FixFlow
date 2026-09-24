import mongoose, { isValidObjectId } from 'mongoose'
import { Issue, IssueStatusHistory } from '../models/index.js'

type TechnicianIssueData = {
    id: string
    title: string
    description: string
    location: string
    status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    reporterId: {
        id: string
        name: string
        email: string
    } | null
    categoryId: {
        id: string
        name: string
    } | null
    createdAt: Date
    updatedAt: Date
}

export async function getAssignedIssues(technicianId: string)
{
    const issues = await Issue.find({ technicianId })
    .populate('reporterId', 'name email')
    .populate('categoryId', 'name')
    .sort({ createdAt: -1 })

    return issues.map((issue) => {
        const data = issue.toJSON() as unknown as TechnicianIssueData

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

export async function getTechnicianIssueById(technicianId: string, issueId: string) 
{
    if (!isValidObjectId(issueId))
    {
        return null
    }

    const issue = await Issue.findOne({ _id: issueId, technicianId })
        .populate('reporterId', 'name email')
        .populate('categoryId', 'name')

    if (!issue)
    {
        return null
    }

    const data = issue.toJSON() as unknown as TechnicianIssueData

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
}

export async function updateTechnicianIssueStatus(technicianId: string, issueId: string, nextStatus: 'in_progress' | 'completed')
{
    if (!isValidObjectId(issueId))
    {
        return {
            type: 'not_found',
        } as const
    }

    const session = await mongoose.startSession()

    try
    {
        session.startTransaction()

        const issue = await Issue.findOne({
            _id: issueId,
            technicianId,
        }).session(session)

        if (!issue)
        {
            await session.abortTransaction()

            return {
                type: 'not_found',
            } as const
        }

        const currentStatus = issue.status

        const validTransition = (currentStatus === 'assigned' && nextStatus === 'in_progress') || (currentStatus === 'in_progress' && nextStatus === 'completed')

        if (!validTransition)
        {
            await session.abortTransaction()

            return {
                type: 'invalid_transition',
                currentStatus,
            } as const
        }

        issue.status = nextStatus

        await issue.save({ session })

        await IssueStatusHistory.create(
            [
                {
                    issueId: issue._id,
                    changedBy: technicianId,
                    fromStatus: currentStatus,
                    toStatus: nextStatus,
                    changedAt: new Date(),
                },
            ],
            { session }
        )

        await session.commitTransaction()

        return {
            type: 'updated',
            issue: {
                id: issue.id,
                status: issue.status,
                updatedAt: issue.get('updatedAt'),
            },
        } as const
    }
    catch (error)
    {
        if (session.inTransaction())
        {
            await session.abortTransaction()
        }

        throw error
    }
    finally
    {
        await session.endSession()
    }
}