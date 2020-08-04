import { Storage } from '@google-cloud/storage';
import { GoogleCloudStorageService } from '.';
import { v4 as uuid } from 'uuid';

jest.mock('@google-cloud/storage');
jest.mock('uuid');

describe('GoogleCloudStorageService', () => {
  let expectedUrlToUpload;
  let mockedUUID;
  let userId;
  let originalFileName;
  let bucketName;
  let host;

  beforeAll(async () => {
    bucketName = 'someBucketName';
    host = 'https://some-host.com';
    expectedUrlToUpload = 'https://url-to-generate-presigned-url.com';
    mockedUUID = 12345;
    userId = 12345;
    originalFileName = 'image.png';

    uuid.mockImplementation(() => mockedUUID);
    
    (Storage as any).mockImplementation(() => {
      return {
        bucket: () => ({
          file: () => ({
            getSignedUrl: async () => {
              return [expectedUrlToUpload];
            }
          })
        })
      }
    });
  });

  it('returns urlToUpload and publicUrl', async () => {
    const service = new GoogleCloudStorageService({
      host,
      bucketName,
    });

    const result = await service.generateUrls(userId, originalFileName); 

    expect(result).toEqual({
      urlToUpload: expectedUrlToUpload,
      publicUrl: `${host}/${bucketName}/${userId}/${mockedUUID}.${originalFileName.split('.')[1]}`  
    })
  });
});
