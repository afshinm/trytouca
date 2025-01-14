// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { suiteCreate } from '@/models/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { tracker } from '@/utils/tracker'

/**
 * Register a new suite.
 *
 * we impose the following restrictions on suite slug:
 *  - should be lowercase
 *  - should be between 3 to 16 characters
 *  - may contain alphanumeric characters as well as hyphens
 *  - should start with an alphabetic character
 */
export async function ctrlSuiteCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  const proposed = req.body as { slug: string; name: string }
  const tuple = [team.slug, proposed.slug].join('/')
  logger.debug('%s: creating suite %s', user.username, tuple)

  // return 409 if suite slug is taken

  if (!(await suiteCreate(user, team, proposed))) {
    return next({
      errors: ['suite already registered'],
      status: 409
    })
  }

  // add event to tracking system

  tracker.track(user, 'created_suite')

  // redirect to lookup route for this newly created suite

  const redirectPath = [config.express.root, 'suite', team.slug, proposed.slug]
  return res.status(201).redirect(redirectPath.join('/').replace(/\/+/g, '/'))
}
