import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { env } from '../config/env.js'
import { Comment, Issue, IssueStatusHistory, Notification, User } from '../models/index.js'
import { cleanupAllowed } from './e2e-target.js'

// removes everything the e2e suite created: accounts ending in @e2e.local and whatever points at them

const target = cleanupAllowed(env.mongodbUri, process.env)
if (!target.ok) {
  console.error(`e2e cleanup refused: ${target.reason}`)
  process.exit(2)
}

try {
  await connectDatabase()

  const users = await User.find({ email: /@e2e\.local$/i }).select('_id')
  const userIds = users.map((user) => user._id)

  const issues = await Issue.find({ $or: [{ reporterId: { $in: userIds } }, { technicianId: { $in: userIds } }] }).select('_id')
  const issueIds = issues.map((issue) => issue._id)

  const [comments, history, notifications, removedIssues, removedUsers] = await Promise.all([
    Comment.deleteMany({ $or: [{ issueId: { $in: issueIds } }, { userId: { $in: userIds } }] }),
    IssueStatusHistory.deleteMany({ $or: [{ issueId: { $in: issueIds } }, { changedBy: { $in: userIds } }] }),
    Notification.deleteMany({ $or: [{ issueId: { $in: issueIds } }, { userId: { $in: userIds } }] }),
    Issue.deleteMany({ _id: { $in: issueIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ])

  console.log(`e2e cleanup (${target.reason}): ${removedUsers.deletedCount} accounts, ${removedIssues.deletedCount} issues, ${comments.deletedCount} comments, ${history.deletedCount} history rows, ${notifications.deletedCount} notifications`)
} catch (error) {
  console.error('e2e cleanup failed', error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}
