import { Storage } from '@google-cloud/storage';
import { GoogleCloudStorageService } from '.';
import { v4 as uuid } from 'uuid';
import nock from 'nock';

jest.mock('@google-cloud/storage');
jest.mock('uuid');

describe('GoogleCloudStorageService', () => {
  let expectedUrlToUpload;
  let mockedUUID;
  let userId;
  let originalFileName;
  let bucketName;
  let host;
  let generatePublicURL;

  beforeAll(async () => {
    bucketName = 'someBucketName';
    host = 'https://some-host.com';
    expectedUrlToUpload = 'https://url-to-generate-presigned-url.com';
    mockedUUID = 12345;
    userId = 12345;
    originalFileName = 'image.png';

    uuid.mockImplementation(() => mockedUUID);
    
    nock(expectedUrlToUpload)
      .post('/')
      .reply(200);

    (Storage as any).mockImplementation(() => {
      return {
        bucket: () => ({
          file: () => ({
            getSignedUrl: async () => {
              return [expectedUrlToUpload];
            },
            delete: () => {},
          }),
        })
      }
    });

    generatePublicURL = () => {
      return `${host}/${bucketName}/${userId}/${mockedUUID}.${originalFileName.split('.')[1]}`;
    }
  });

  it('returns urlToUpload and publicUrl', async () => {
    const service = new GoogleCloudStorageService({
      host,
      bucketName,
    });

    const [result] = await service.generateUrls(userId, [originalFileName]); 

    expect(result).toEqual({
      urlToUpload: expectedUrlToUpload,
      publicUrl: `${host}/${bucketName}/${userId}/${mockedUUID}.${originalFileName.split('.')[1]}`  
    })
  });

  it('uploads files properly', async () => {
    const service = new GoogleCloudStorageService({
      host,
      bucketName,
    });

    const publicUrls = await service.uploadFiles(userId, [{ name: originalFileName}] as File[])

    expect(publicUrls.length).toBe(1);
    expect(publicUrls[0]).toBe(generatePublicURL()); 
  }); 

  it('deletes files properly', async () => {
    const service = new GoogleCloudStorageService({
      host,
      bucketName,
    });

    const removedFilesNames = await service.deleteFiles([generatePublicURL()])

    expect(removedFilesNames).toEqual([`${mockedUUID}.png`]);
  });
});
