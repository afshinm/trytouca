// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { ITeam, TeamModel } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import { ETeamRole } from '@/types/commontypes'

/**
 * @summary provides a list of members and admins of a given team.
 *
 * @description
 * Performs a single database query.
 *
 * @param team team whose members should be returned
 * @param role roles of the users within this time to return
 * @returns list of users who are either members or admins of a given team.
 */
export async function findTeamUsersByRole(
  team: ITeam,
  roles: ETeamRole[]
): Promise<IUser[]> {
  const fields = []
  if (roles.includes(ETeamRole.Owner)) {
    fields.push(['$owner'])
  }
  if (roles.includes(ETeamRole.Admin)) {
    fields.push('$admins')
  }
  if (roles.includes(ETeamRole.Member)) {
    fields.push('$members')
  }

  const result: IUser[] = await TeamModel.aggregate([
    { $match: { _id: team._id } },
    { $project: { items: { $concatArrays: fields } } },
    {
      $lookup: {
        from: 'users',
        localField: 'items',
        foreignField: '_id',
        as: 'itemDocs'
      }
    },
    {
      $project: {
        _id: 0,
        'itemDocs._id': 1,
        'itemDocs.email': 1,
        'itemDocs.fullname': 1,
        'itemDocs.platformRole': 1,
        'itemDocs.username': 1
      }
    },
    { $unwind: '$itemDocs' },
    { $replaceRoot: { newRoot: '$itemDocs' } }
  ])
  return result
}

/**
 * @summary
 * Finds role of a user in a given team.
 *
 * @description
 * Performs a single database query.
 *
 * @return role of the user in a given team. `ETeamRole.Invalid` if user is
 * not a member of the team.
 */
export async function findTeamRoleOfUser(
  team: ITeam,
  user: IUser
): Promise<ETeamRole> {
  type DatabaseOutput = { role: ETeamRole }
  const result: DatabaseOutput[] = await TeamModel.aggregate([
    { $match: { _id: team._id } },
    {
      $project: {
        role: {
          $cond: {
            if: { $in: [user._id, '$members'] },
            then: 'member',
            else: {
              $cond: {
                if: { $in: [user._id, '$admins'] },
                then: 'admin',
                else: {
                  $cond: {
                    if: { $eq: [user._id, '$owner'] },
                    then: 'owner',
                    else: 'invalid'
                  }
                }
              }
            }
          }
        }
      }
    }
  ])
  return result[0].role
}
