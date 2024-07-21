import ImageProperties from "./imageProperties";
import ImageOperations from "./ImageOperations";
import { readFileSync } from "fs";
import sharp from "sharp";
import { PixelArray, RGBColor, RGBAColor } from "../types";

export default class Image {
  private _path?: string;
  private _buffer: Buffer;
  private _pixelArray: PixelArray<RGBColor | RGBAColor>;
  private _properties: ImageProperties;
  private _operations: ImageOperations;
  private constructor(
    buffer: Buffer,
    array: PixelArray<RGBColor | RGBAColor>,
    path?: string
  ) {
    this._buffer = buffer;
    this._path = path;
    this._pixelArray = array;
    this._properties = new ImageProperties(this);
    this._operations = new ImageOperations(this);
  }
  public get properties(): ImageProperties {
    return this._properties;
  }
  public get operations(): ImageOperations {
    return this._operations;
  }
  public get buffer(): Buffer {
    return this._buffer;
  }
  public get path(): string | undefined {
    return this._path;
  }
  public get pixelArray(): PixelArray<RGBColor | RGBAColor> {
    return this._pixelArray;
  }

  public static async getPixelArray<T extends RGBColor | RGBAColor>(
    image: Buffer | Image,
    object?: {
      greyscaled?: boolean;
      removeAlpha?: boolean;
      xUpscale?: number;
    }
  ): Promise<PixelArray<T>> {
    let sharpInstance;
    if (image instanceof Image) {
      if (object) {
        sharpInstance = sharp(image.buffer);
      } else {
        return image.pixelArray as PixelArray<T>;
      }
    } else {
      if (!(await Image.isImageBuffer(image))) {
        throw new Error("Invalid buffer");
      }
      sharpInstance = sharp(image);
    }
    if (object?.greyscaled) sharpInstance = sharpInstance.grayscale();
    if (object?.removeAlpha) sharpInstance = sharpInstance.removeAlpha();
    if (object?.xUpscale) {
      sharpInstance = sharpInstance.resize({
        width: object.xUpscale,
        fit: "contain",
      });
    }
    const { data, info } = await sharpInstance
      .raw()
      .toBuffer({ resolveWithObject: true });
    let channels = info.channels; // ...
    let pixelArr: PixelArray<T> = [];
    for (let x = 0; x < info.width; x++) {
      // read each pixel while already greyscaling it
      const column: T[] = [];
      for (let y = 0; y < info.height; y++) {
        const offset = (y * info.width + x) * channels;
        let r = data[offset];
        let g = data[offset + 1];
        let b = data[offset + 2];
        let pixel: T;
        if (channels === 4) {
          let a = data[offset + 3];
          pixel = { r, g, b, a } as T;
        } else {
          pixel = { r, g, b } as T;
        }
        column.push(pixel);
      }
      pixelArr.push(column);
    }
    return pixelArr;
  }
  public static async saveFromArray<T extends RGBColor | RGBAColor>(
    pixels: PixelArray<T>,
    path: string
  ) {
    if (pixels.length === 0 || pixels[0].length === 0) {
      return Buffer.alloc(0); // if empty arr "return" empty buffer
    }
    const width = pixels.length;
    const height = pixels[0].length;
    const isRGBA = "a" in pixels[0][0]; // see if its an RGBA --> [0][0] check is enough bc of strictness coming from T :]

    const channels = isRGBA ? 4 : 3;

    const imageData = {
      data: new Uint8ClampedArray(width * height * channels),
      width: width,
      height: height,
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let pixel;
        pixel = pixels[x][y];
        if (!pixel) {
          pixel = { r: 0, g: 0, b: 0, a: 0 };
        }
        const offset = (y * width + x) * channels;
        imageData.data[offset] = pixel.r;
        imageData.data[offset + 1] = pixel.g;
        imageData.data[offset + 2] = pixel.b;
        if (isRGBA) {
          imageData.data[offset + 3] = (pixel as RGBAColor).a;
        } else {
          imageData.data[offset + 3] = 255;
        }
      }
    }
    await sharp(imageData.data, {
      raw: {
        width: imageData.width,
        height: imageData.height,
        channels: channels,
      },
    }).toFile(path);
    /* let buffer = await sharp(imageData.data, {
      raw: {
        width: imageData.width,
        height: imageData.height,
        channels: channels,
      },
    }).toBuffer();
    await sharp(buffer).toFile("./test.png"); */ // NOT WORKING! --> save directly
  }
  public static async bufferToFile(buffer: Buffer, path: string) {
    if (!(await Image.isImageBuffer(buffer))) {
      throw new Error("received invalid buffer"); // await sharp would call own error tho
    }
    await sharp(buffer).toFile(path);
  }
  public static async create(
    input: string | Buffer
  ): Promise<Image | undefined> {
    let path: string | undefined;
    let array: PixelArray<RGBColor | RGBAColor>;
    if (typeof input === "string") path = input;
    let isImg = await this.isImage(input, true); // isImg returns buffer bc of second arg === true
    if (Buffer.isBuffer(isImg)) {
      array = await Image.getPixelArray(isImg);
    } else {
      throw new Error("Invalid image-input given");
    }
    return new Image(isImg as Buffer, array, path);
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

example();
async function example() {
  // example usage
  const img = await Image.create("./game.webp"); // load valid image here
  if (img) {
    // if img makes sure its an instance of Image (the class), so we can work with it always without any further checks or problems
    let pixelArr = await Image.getPixelArray(img, {
      greyscaled: true,
      xUpscale: 1000,
    }); // gets an pixelArray two dimensional [x][y] with RGB(a) objects, while filter greyscaled and xUpscale are applied
    await Image.saveFromArray(pixelArr, "./test.png"); // save pixelarray (with filters as image file
    await Image.saveFromArray(img.pixelArray, "./test2.png"); // save original pixelarray emitted from image type Image

    let newPixelArr: PixelArray<RGBAColor> = [
      // create own Pixel array object with strict RGBAColor type (while irregular scheme is OK)
      [
        { r: 200, g: 0, b: 0, a: 255 },
        { r: 50, g: 74, b: 255, a: 255 },
      ],
      [{ r: 0, g: 233, b: 0, a: 255 }],
    ];
    await Image.saveFromArray(newPixelArr, "./test3.png"); // save own PixelArray as image file
    console.log(img.properties.getBackgroundColor()); // get background color of image
  }
}
