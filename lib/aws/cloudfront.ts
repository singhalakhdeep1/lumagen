// AWS CloudFront integration for lumagen

import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

function cloudFrontClient(): CloudFrontClient {
  return new CloudFrontClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })
}

export async function invalidateCache(paths: string[]): Promise<string> {
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID
  if (!distributionId) throw new Error('CLOUDFRONT_DISTRIBUTION_ID is not set')
  const command = new CreateInvalidationCommand({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      Paths: {
        Quantity: paths.length,
        Items: paths,
      },
    },
  })

  const response = await cloudFrontClient().send(command)
  return response.Invalidation?.Id || ''
}

export async function invalidateImage(imageKey: string): Promise<string> {
  return invalidateCache([`/${imageKey}`])
}

/** The public CloudFront URL for a stored object, or null when no distribution is configured. */
export function getCloudFrontUrl(imageKey: string): string | null {
  const domain = process.env.CLOUDFRONT_DOMAIN
  return domain ? `https://${domain}/${imageKey}` : null
}
