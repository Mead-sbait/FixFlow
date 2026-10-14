import mongoose, { isValidObjectId } from 'mongoose'
import { Comment, Issue, IssueStatusHistory } from '../models/index.js'
import { createNotification } from './notification.service.js'
import { emitToUser } from '../sockets/emitter.js'

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

        const updatedIssue = {
            id: issue.id,
            status: issue.status,
            updatedAt: issue.get('updatedAt'),
        }

        const reporterId = issue.reporterId.toString()

        // Notify the technician about the updated issue
        emitToUser(technicianId, 'issue:updated', {
            issueId: issue.id,
        })

        // Notify the reporter about the updated issue
        emitToUser(reporterId, 'issue:updated', {
            issueId: issue.id,
        })

        // Create a persistent notification for the reporter
        try
        {
            await createNotification({
                userId: reporterId,
                issueId: issue.id,
                type: 'issue_updated',
                message: `Issue status changed to ${nextStatus.replace('_', ' ')}.`,
            })
        }
        catch (error)
        {
            console.error(
                'Issue updated, but notification creation failed:',
                error
            )
        }

        return {
            type: 'updated',
            issue: updatedIssue,
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


type TechnicianCommentData = {
    id: string
    userId: {
        id: string
        name: string
        role: 'user' | 'technician' | 'admin'
    } | null
    message: string
    isInternal: boolean
    createdAt: Date
}

function formatTechnicianComment(data: TechnicianCommentData, issueId: string) 
{
    return {
        id: data.id,
        issueId,
        author: data.userId,
        message: data.message,
        isInternal: data.isInternal,
        createdAt: data.createdAt,
    }
}

// Get comments for an assigned issue
export async function getTechnicianIssueComments(technicianId: string, issueId: string)
{
    if (!isValidObjectId(issueId))
    {
        return null
    }

    const issue = await Issue.exists({
        _id: issueId,
        technicianId,
    })

    if (!issue)
    {
        return null
    }

    const comments = await Comment.find({ issueId })
        .populate('userId', 'name role')
        .sort({ createdAt: 1 })

    return comments.map((comment) => {
        const data = comment.toJSON() as unknown as TechnicianCommentData

        return formatTechnicianComment(data, issueId)
    })
}

// Add a comment or internal note

export async function createTechnicianIssueComment(technicianId: string, issueId: string, message: string, isInternal: boolean)
{
    if (!isValidObjectId(issueId))
    {
        return null
    }

    // Verify that the issue belongs to this technician
    const issue = await Issue.findOne({
        _id: issueId,
        technicianId,
    }).select('reporterId')

    if (!issue)
    {
        return null
    }

    // Save the comment in MongoDB
    const comment = await Comment.create({
        issueId,
        userId: technicianId,
        message,
        isInternal,
    })

    const savedComment = await Comment.findById(comment._id)
        .populate('userId', 'name role')

    if (!savedComment)
    {
        throw new Error('Comment not found after creation')
    }

    const data = savedComment.toJSON() as unknown as TechnicianCommentData

    // Refresh the technician's connected clients
    emitToUser(technicianId, 'comment:added', {
        issueId,
    })

    // Public comments only
    if (!isInternal)
    {
        const reporterId = issue.reporterId.toString()

        // Notify the reporter's connected clients
        emitToUser(reporterId, 'comment:added', {
            issueId,
        })

        // Save a persistent notification for the reporter
        try
        {
            await createNotification({
                userId: reporterId,
                issueId,
                type: 'comment_added',
                message: 'A new comment was added to your issue.',
            })
        }
        catch (error)
        {
            console.error(
                'Comment saved, but notification creation failed:',
                error
            )
        }
    }

    return formatTechnicianComment(data, issueId)
}