// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { SessionModel } from '@/schemas/session'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'
import { tracker } from '@/utils/tracker'

export async function authSessionRemove(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const askedAgent = req.headers['user-agent']
  const askedIpAddress = req.ip
  logger.debug('%s: received logout request', user.username)

  // find user session with matching metadata and expire it.
  //
  // @todo using aggregate that matches first for userId and then
  //       for other fields would be more efficient

  const session = await SessionModel.findOneAndUpdate(
    {
      agent: askedAgent,
      expiresAt: { $gt: new Date() },
      ipAddr: askedIpAddress,
      userId: user._id
    },
    { $set: { expiresAt: new Date() } }
  )

  // we expect that we find one and only one session for this user
  // that matches the provided metadata.
  //
  // @todo notifyOwner if session is not found.

  if (!session) {
    logger.error('%s: failed to close user session', user.username)
    return next({
      errors: ['session not found'],
      status: 404
    })
  }

  logger.info('%s: closed user session %s', user.username, session._id)

  // add event to tracking system

  tracker.track(user, 'logged_out')

  return res.clearCookie('authToken').status(204).send()
}
