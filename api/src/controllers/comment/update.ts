// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { extractCommentTuple } from '@/models/comment'
import { CommentModel, ICommentDocument } from '@/schemas/comment'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'
import { tracker } from '@/utils/tracker'

export async function ctrlCommentUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const comment = res.locals.comment as ICommentDocument
  const tuple = extractCommentTuple(res)
  logger.debug('%s: %s: editing comment', user.username, tuple)

  if (!comment.by.equals(user._id)) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }
  logger.silly('%s: can edit comment %s', user.username, comment._id)

  await CommentModel.findByIdAndUpdate(comment._id, {
    editedAt: new Date(),
    text: req.body.body
  })

  // remove information about list of comments from cache.
  // we wait for this operation to avoid race condition.

  await rclient.removeCached(`route_commentList_${tuple}`)

  logger.info('%s: %s: edited comment', user.username, tuple)
  tracker.track(user, 'comment_edit')
  return res.status(204).send()
}
