import type { Request, Response } from 'express'
import { getAssignedIssues, getTechnicianIssueById, updateTechnicianIssueStatus, getTechnicianIssueComments, createTechnicianIssueComment } from '../services/technician.service.js'
import { updateTechnicianStatusSchema, createTechnicianCommentSchema } from '../validators/technician.validator.js'

export async function getTechnicianIssues(_req: Request, res: Response)
{
    try {
        const technicianId = res.locals.auth.userId

        const issues = await getAssignedIssues(technicianId)

        res.status(200).json(issues)
    } catch {
        res.status(500).json({ error: 'Unable to load assigned issues', code: 'INTERNAL_ERROR' })
    }
}

export async function getTechnicianIssue(req: Request<{ id: string }>, res: Response)
{
    try
    {
        const technicianId = res.locals.auth.userId
        const issueId = req.params.id

        const issue = await getTechnicianIssueById(technicianId, issueId)

        if (!issue)
        {
            res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' })
            return
        }

        res.status(200).json(issue)
    }
    catch
    {
        res.status(500).json({ error: 'Unable to load issue', code: 'INTERNAL_ERROR' })
    }
}

export async function updateTechnicianStatus(req: Request<{ id: string }>, res: Response)
{
    try
    {
        const technicianId = res.locals.auth.userId
        const issueId = req.params.id

        const validation = updateTechnicianStatusSchema.safeParse(req.body)

        if (!validation.success)
        {
            res.status(400).json({ error: 'Invalid status', code: 'VALIDATION_ERROR' })

            return
        }

        const result = await updateTechnicianIssueStatus(technicianId, issueId, validation.data.status)

        if (result.type === 'not_found')
        {
            res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' })

            return
        }

        if (result.type === 'invalid_transition')
        {
            res.status(409).json({ error: `Cannot change status from ${result.currentStatus} to ${validation.data.status}`, code: 'CONFLICT' })

            return
        }

        res.status(200).json(result.issue)
    }
    catch
    {
        res.status(500).json({ error: 'Unable to update issue status', code: 'INTERNAL_ERROR' })
    }
}

// GET comments for a technician issue
export async function getTechnicianComments(
    req: Request<{ id: string }>,
    res: Response
) {
    try
    {
        const technicianId = res.locals.auth.userId
        const issueId = req.params.id

        const comments = await getTechnicianIssueComments(
            technicianId,
            issueId
        )

        if (comments === null)
        {
            res.status(404).json({
                error: 'Issue not found',
                code: 'NOT_FOUND',
            })
            return
        }

        res.status(200).json(comments)
    }
    catch
    {
        res.status(500).json({
            error: 'Unable to load comments',
            code: 'INTERNAL_ERROR',
        })
    }
}

// POST a new comment or internal note
export async function addTechnicianComment(req: Request<{ id: string }>, res: Response)
{
    try
    {
        const technicianId = res.locals.auth.userId
        const issueId = req.params.id

        const validation = createTechnicianCommentSchema.safeParse(req.body)

        if (!validation.success)
        {
            res.status(400).json({
                error: 'Invalid comment data',
                code: 'VALIDATION_ERROR',
            })
            return
        }

        const { message, isInternal } = validation.data

        const comment = await createTechnicianIssueComment(
            technicianId,
            issueId,
            message,
            isInternal
        )

        if (comment === null)
        {
            res.status(404).json({
                error: 'Issue not found',
                code: 'NOT_FOUND',
            })
            return
        }

        res.status(201).json(comment)
    }
    catch
    {
        res.status(500).json({
            error: 'Unable to create comment',
            code: 'INTERNAL_ERROR',
        })
    }
}