// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { UserModel } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { tracker } from '@/utils/tracker'

export async function authResetKeyCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const askedEmail = (req.body.email as string).toLowerCase()
  logger.debug('received request to create password reset key')

  // check if email is associated with any account

  const user = await UserModel.findOne(
    { email: askedEmail },
    {
      _id: 1,
      email: 1,
      fullname: 1,
      lockedAt: 1,
      suspended: 1,
      username: 1
    }
  )

  // abort if account associated with given email is not found

  if (!user) {
    logger.warn('%s: account not found', askedEmail)
    return next({
      errors: ['account not found'],
      status: 404
    })
  }

  // abort if user is indefinitely suspended

  if (user.suspended) {
    logger.warn('%s: rejecting reset request of suspended user', user.username)
    return next({
      errors: ['account suspended'],
      status: 423
    })
  }

  // abort if user is temporarily locked

  if (user.lockedAt) {
    const lockedUntil = user.lockedAt
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 30)
    if (new Date() < lockedUntil) {
      logger.warn('%s: rejecting reset request of locked user', user.username)
      return next({
        errors: ['account locked'],
        status: 423
      })
    }
  }

  // generate reset key in RFC4122 uuid format

  const resetKey = uuidv4()

  // find maximum lifetime of reset key

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + config.auth.maxResetKeyLifetime)

  // apply reset key to user account

  logger.silly('%s: applying reset key to user account', user.username)
  await UserModel.findByIdAndUpdate(user._id, {
    $set: { resetKey, resetKeyExpiresAt: expiresAt }
  })
  logger.info('%s: applied reset key to user account', user.username)

  // send email to user with their reset key

  mailer.mailUser(user, 'Password Reset', 'auth-password-start', {
    greetings: user.fullname ? `Hi ${user.fullname}` : `Hello`,
    expiresIn: config.auth.maxResetKeyLifetime.toString(),
    resetLink: `${config.webapp.root}/account/reset?key=${resetKey}`
  })

  // add event to tracking system

  tracker.track(user, 'password_initiated')

  return res.status(204).send()
}
