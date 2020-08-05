import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import path from "path";
import { v4 as uuid } from "uuid";

export interface Config {
  bucketName: string;
  host: string;
}

interface Url {
  urlToUpload: string;
  publicUrl: string;
}

type Urls = Url[];

interface GoogleStorageService {
  generateUrls: (userId: string, originalFilesNames: string[]) => Promise<Urls>;
}

export class GoogleCloudStorageService implements GoogleStorageService {
  private config: Config;
  private storage: Storage;

  constructor(config: Config) {
    this.config = config;
    this.storage = new Storage();
  }

  private generateFilesNames(
    userId: string,
    originalFilesNames: string[]
  ): string[] {
    return originalFilesNames.map(originalFileName => {
      const fileExtension = path.extname(originalFileName);

      return `${userId}/${uuid()}${fileExtension}`;
    });
  }

  private generatePublicUrl(filesNames: string[]): string[] {
    return filesNames.map(fileName => {
      const { host, bucketName } = this.config;

      return `${host}/${bucketName}/${fileName}`;
    });
  }

  public async generateUrls(userId, originalFilesNames) {
    const options: GetSignedUrlConfig = {
      version: "v4",
      action: "write",
      expires: Date.now() + 1000 * 60 * 60,
      contentType: "application/octet-stream"
    };

    const filesNames = this.generateFilesNames(userId, originalFilesNames);

    const urlsToUpload = await Promise.all(
      filesNames.map(fileName => {
        return this.storage
          .bucket(this.config.bucketName)
          .file(fileName)
          .getSignedUrl(options);
      })
    );

    const publicUrls = this.generatePublicUrl(filesNames);

    return urlsToUpload.map(([urlToUpload], index) => {
      return { urlToUpload, publicUrl: publicUrls[index] };
    });
  }
}
