import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createTechnicianComment, getTechnicianComments } from '../technicianApi'
import type { TechnicianComment } from '../technician.types'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../app/store'
import { Icon } from '../../../components/Icon'
import { useT } from '../../../i18n'
import { formatDate } from '../../../lib/roles'

type Props = {
    token: string
    issueId: string
}

export function TechnicianComments({ token, issueId }: Props)
{
    const { t, locale } = useT()
    const commentsRevision = useSelector((state: RootState) => state.technician.commentsRevision[issueId] ?? 0)
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
            setError(null)

            try {
                const result = await getTechnicianComments(token, issueId)
                if (active) setComments(result)
            } catch {
                if (active) setError('load')
            } finally {
                if (active) setLoading(false)
            }
        }

        void loadComments()

        return () => {
            active = false
        }
    }, [token, issueId, commentsRevision])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const trimmedMessage = message.trim()
        if (!trimmedMessage || submitting) return

        setSubmitting(true)
        setError(null)

        try {
            const newComment = await createTechnicianComment(token, issueId, { message: trimmedMessage, isInternal })
            setComments((previous) => [...previous, newComment])
            setMessage('')
            setIsInternal(false)
        } catch {
            setError('add')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section aria-labelledby="comments-heading">
            <h2 id="comments-heading">{t('comments.title')}</h2>

            {error && (
                <div className="notice notice--error" role="alert" style={{ marginBottom: 12 }}>
                    <Icon name="alert" size={16} />{error === 'load' ? t('comments.loadFailed') : t('comments.addFailed')}
                </div>
            )}

            {loading ? (
                <p className="loading">{t('common.loading')}</p>
            ) : comments.length === 0 ? (
                <p className="muted">{t('comments.empty')}</p>
            ) : (
                <div className="comments">
                    {comments.map((comment) => (
                        <article key={comment.id} className={comment.isInternal ? 'comment comment--internal' : 'comment'}>
                            <div className="comment__head">
                                <strong>{comment.author?.name ?? t('common.unknown')}</strong>
                                {comment.author?.role && <span className={`tag tag--${comment.author.role}`}>{t(`role.${comment.author.role}`)}</span>}
                                {comment.isInternal && <span className="tag tag--internal"><Icon name="note" size={12} /> {t('comments.internalTag')}</span>}
                                <time dateTime={comment.createdAt}>{formatDate(comment.createdAt, locale, true)}</time>
                            </div>
                            <p>{comment.message}</p>
                        </article>
                    ))}
                </div>
            )}

            <form className="comment-form" onSubmit={handleSubmit}>
                <div className="field">
                    <label htmlFor="technician-comment">{t('comments.add')}</label>
                    <textarea
                        id="technician-comment"
                        className="textarea"
                        style={{ minHeight: 90 }}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder={isInternal ? t('comments.internalPlaceholder') : t('comments.publicPlaceholder')}
                        maxLength={2000}
                        rows={3}
                        required
                    />
                </div>

                <div className="comment-form__row">
                    <label className="check">
                        <input type="checkbox" checked={isInternal} onChange={(event) => setIsInternal(event.target.checked)} />
                        {t('comments.internal')}
                    </label>

                    <button type="submit" className="btn btn--secondary" disabled={submitting || !message.trim()}>
                        {submitting ? t('comments.sending') : isInternal ? t('comments.submitNote') : t('comments.submit')}
                    </button>
                </div>
            </form>
        </section>
    )
}
