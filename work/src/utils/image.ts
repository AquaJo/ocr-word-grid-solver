import { readFileSync } from "fs";
import sharp from "sharp";

export default class Image {
  private _path?: string;
  private _buffer: Buffer;
  private constructor(buffer: Buffer, path?: string) {
    this._buffer = buffer;
    this._path = path;
  }

  public get buffer(): Buffer {
    return this._buffer;
  }
  public get path(): string | undefined {
    return this._path;
  }

  public static async create(
    input: string | Buffer
  ): Promise<Image | undefined> {
    let path: string | undefined;
    if (typeof input === "string") path = input;
    let isImg = await this.isImage(input, true);
    return isImg ? new Image(isImg as Buffer, path) : undefined;
  }

  public static async isImage(
    input: string | Buffer | Image,
    returnBuffer?: boolean
  ): Promise<boolean | Buffer> {
    if (input instanceof Image) return true;
    let buffer: Buffer;
    if (typeof input === "string") {
      try {
        buffer = this.createBufferFromPath(input);
      } catch (e) {
        return false;
      }
    } else {
      buffer = input; // automatically instanceof Buffer
    }

    const isImage = await this.isImageBuffer(buffer);

    return returnBuffer ? buffer : isImage;
  }

  public static async isImageBuffer(buffer: Buffer): Promise<boolean> {
    try {
      await sharp(buffer).metadata();
      return true;
    } catch (error) {
      return false;
    }
  }

  private static createBufferFromPath(path: string): Buffer {
    try {
      return readFileSync(path);
    } catch (error) {
      throw new Error("Failed to create buffer from path");
    }
  }
}
