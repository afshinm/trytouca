// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Redis from 'ioredis'

import { config } from '@/utils/config'
import logger from '@/utils/logger'

export const client = new Redis({
  host: config.redis.host,
  lazyConnect: true,
  port: config.redis.port,
  showFriendlyErrorStack: config.env !== 'production'
})

client.on('error', (err) => {
  // we suppress error emission here to prevent duplicate error messages
  // during application startup.
})
client.on('connect', () => {
  logger.debug('redis connections established')
})
client.on('ready', () => {
  logger.debug('redis client is ready')
})

/**
 * attempt to connect to the redis cache server.
 *
 * @returns {Promise<boolean>} true if connection is successful
 */
export async function makeConnectionRedis(): Promise<boolean> {
  client.disconnect()
  await client.connect()
  client.on('error', (err) => {
    logger.warn('redis connection error: %s', err.message)
  })
  return true
}

export async function shutdownRedis() {
  logger.info('disconnecting from redis')
  if (client.status === 'ready') {
    await client.quit()
  }
}

async function isCached(cacheKey: string): Promise<boolean> {
  return Boolean(await client.exists(cacheKey))
}

async function getCached<T>(cacheKey: string): Promise<T> {
  const str = await client.get(cacheKey)
  return JSON.parse(str) as T
}

async function cache(
  cacheKey: string,
  output: unknown,
  cacheDuration?: number
): Promise<boolean> {
  cacheDuration = cacheDuration || config.redis.durationShort
  return client
    .set(cacheKey, JSON.stringify(output), 'EX', cacheDuration)
    .then((value) => {
      if (value === 'OK') {
        logger.silly('%s: cached', cacheKey)
        return true
      }
      logger.warn('%s: failed to cache', cacheKey)
      return false
    })
    .catch((err) => {
      logger.warn('%s: failed to cache: %O', cacheKey, err)
      return false
    })
}

async function removeCached(cacheKey: string): Promise<boolean> {
  return client
    .del(cacheKey)
    .then((value) => {
      logger.debug('%s: removed cached result', cacheKey)
      return Boolean(value)
    })
    .catch((err) => {
      logger.warn('%s: failed to remove cached result: %O', cacheKey, err)
      return false
    })
}

function removeCachedByPrefix(prefix: string, suffix = ''): void {
  client
    .scanStream({ match: `${prefix}*${suffix}` })
    .on('data', (keys: string[]) => {
      if (keys.length) {
        const pipeline = client.pipeline()
        keys.forEach((k) => {
          pipeline.del(k)
          logger.info('%s: removed', k)
        })
        pipeline.exec()
      }
    })
    .on('end', () => true)
}

export const rclient = {
  cache,
  getCached,
  isCached,
  removeCached,
  removeCachedByPrefix
}
