/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'

/**
 *
 */
const comparisonSchema = new mongoose.Schema(
  {
    dstBatchId: {
      ref: 'Batch',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    dstMessageId: {
      ref: 'Message',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    elasticId: {
      required: false,
      type: String
    },
    meta: {
      required: false,
      type: {
        keysCountCommon: {
          required: false,
          type: Number
        },
        keysCountFresh: {
          required: false,
          type: Number
        },
        keysCountMissing: {
          required: false,
          type: Number
        },
        keysScore: {
          required: false,
          type: Number
        },
        metricsCountCommon: {
          required: false,
          type: Number
        },
        metricsCountFresh: {
          required: false,
          type: Number
        },
        metricsCountMissing: {
          required: false,
          type: Number
        },
        metricsDurationCommonDst: {
          required: false,
          type: Number
        },
        metricsDurationCommonSrc: {
          required: false,
          type: Number
        }
      }
    },
    processedAt: {
      required: false,
      type: Date
    },
    reservedAt: {
      required: false,
      type: Date
    },
    srcBatchId: {
      ref: 'Batch',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    srcMessageId: {
      ref: 'Message',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    }
  },
  {
    timestamps: true
  }
)

/**
 *
 */
comparisonSchema.index({ srcMessageId: 1 })

/**
 *
 */
comparisonSchema.index({ dstMessageId: 1 })

/**
 *
 */
comparisonSchema.index({ srcBatchId: 1, dstBatchId: 1 })

/**
 *
 */
comparisonSchema.index({ srcMessageId: 1, dstMessageId: 1 })

/**
 *
 */
comparisonSchema.index({ elasticId: 1, processedAt: -1 })

/**
 *
 */
export interface IComparisonDocument extends mongoose.Document {
  dstBatchId: mongoose.Types.ObjectId
  dstMessageId: mongoose.Types.ObjectId
  elasticId: string
  meta: {
    keysCountCommon: number
    keysCountFresh: number
    keysCountMissing: number
    keysScore: number
    metricsCountCommon: number
    metricsCountFresh: number
    metricsCountMissing: number
    metricsDurationCommonDst: number
    metricsDurationCommonSrc: number
  }
  processedAt: Date
  reservedAt: Date
  score: number
  srcBatchId: mongoose.Types.ObjectId
  srcMessageId: mongoose.Types.ObjectId
}

/**
 *
 */
interface IComparisonModel extends mongoose.Model<IComparisonDocument> {
}

/**
 *
 */
export const ComparisonModel: IComparisonModel = mongoose.model<
  IComparisonDocument,
  IComparisonModel
>('Comparison', comparisonSchema)
