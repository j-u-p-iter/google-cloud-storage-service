import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import path from "path";
import { v4 as uuid } from "uuid";

export interface Config {
  bucketName: string;
  host: string;
}

interface Urls {
  urlToUpload: string;
  publicUrl: string;
}

interface GoogleStorageService {
  generateUrls: (userId: string, originalFileName: string) => Promise<Urls>;
}

export class GoogleCloudStorageService implements GoogleStorageService {
  private config: Config;
  private storage: Storage;

  constructor(config: Config) {
    this.config = config;
    this.storage = new Storage();
  }

  private generateFileName(userId, originalFileName) {
    const fileExtension = path.extname(originalFileName);

    return `${userId}/${uuid()}${fileExtension}`;
  }

  private generatePublicUrl(fileName: string): string {
    const { host, bucketName } = this.config;

    return `${host}/${bucketName}/${fileName}`;
  }

  public async generateUrls(userId, originalFileName) {
    const options: GetSignedUrlConfig = {
      version: "v4",
      action: "write",
      expires: Date.now() + 1000 * 60 * 60,
      contentType: "application/octet-stream"
    };

    const fileName: string = this.generateFileName(userId, originalFileName);

    const [urlToUpload] = await this.storage
      .bucket(this.config.bucketName)
      .file(fileName)
      .getSignedUrl(options);

    const publicUrl = this.generatePublicUrl(fileName);

    return { urlToUpload, publicUrl };
  }
}
