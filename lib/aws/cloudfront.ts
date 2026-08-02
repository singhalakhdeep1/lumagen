// AWS CloudFront integration for lumagen

import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID || '';

export async function invalidateCache(paths: string[]): Promise<string> {
  const command = new CreateInvalidationCommand({
    DistributionId: DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: paths.length,
        Items: paths,
      },
    },
  });

  const response = await cloudFrontClient.send(command);
  return response.Invalidation?.Id || '';
}

export async function invalidateImage(imageKey: string): Promise<string> {
  return invalidateCache([`/${imageKey}`]);
}

export function getCloudFrontUrl(imageKey: string): string {
  const domain = process.env.CLOUDFRONT_DOMAIN || '';
  return `https://${domain}/${imageKey}`;
}
