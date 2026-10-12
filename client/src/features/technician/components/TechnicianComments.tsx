
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
    createTechnicianComment,
    getTechnicianComments,
} from '../technicianApi'
import type { TechnicianComment } from '../technician.types'

type Props = {
    token: string
    issueId: string
}

export function TechnicianComments({ token, issueId }: Props) {
    const [comments, setComments] = useState<TechnicianComment[]>([])
    const [message, setMessage] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function loadComments() {
            setLoading(true)
            setComments([])
            setError(null)

            try {
                const result = await getTechnicianComments(token, issueId)

                if (active) {
                    setComments(result)
                }
            } catch {
                if (active) {
                    setError('Unable to load comments.')
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        void loadComments()

        return () => {
            active = false
        }
    }, [token, issueId])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const trimmedMessage = message.trim()

        if (!trimmedMessage || submitting) {
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const newComment = await createTechnicianComment(
                token,
                issueId,
                {
                    message: trimmedMessage,
                    isInternal,
                }
            )

            setComments((previous) => [...previous, newComment])
            setMessage('')
            setIsInternal(false)
        } catch {
            setError('Unable to add comment.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className="technician-comments">
            <h2>Comments & Internal Notes</h2>

            {error && (
                <p className="technician-comments__error" role="alert">
                    {error}
                </p>
            )}

            {loading ? (
                <p>Loading comments...</p>
            ) : comments.length === 0 ? (
                <p>No comments yet.</p>
            ) : (
                <div className="technician-comments__list">
                    {comments.map((comment) => (
                        <article
                            key={comment.id}
                            className="technician-comments__item"
                        >
                            <div className="technician-comments__header">
                                <strong>
                                    {comment.author?.name ?? 'Unknown'}
                                </strong>

                                <span>
                                    {comment.isInternal
                                        ? 'Internal Note'
                                        : 'Public Comment'}
                                </span>
                            </div>

                            <p>{comment.message}</p>

                            <small>
                                {new Date(comment.createdAt).toLocaleString()}
                            </small>
                        </article>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <label htmlFor="technician-comment">
                    Add Comment
                </label>

                <textarea
                    id="technician-comment"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write your comment..."
                    maxLength={2000}
                    rows={4}
                    required
                />

                <label className="technician-comments__checkbox">
                    <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(event) => setIsInternal(event.target.checked)}
                    />
                    Internal Note
                </label>

                <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                >
                    {submitting ? 'Sending...' : 'Add Comment'}
                </button>
            </form>
        </section>
    )
}
