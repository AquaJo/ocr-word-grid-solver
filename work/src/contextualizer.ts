import Image from "./utils/image";
interface AnalOptions_User {
  combineEngines?: boolean;
  store?: boolean;
}
interface AnalOptions_Class {
  combineEngines: boolean;
  store: boolean;
}

interface Context {
  grid: string[][];
  image?: {
    original: Buffer;
    preprocessed: Buffer;
    processed: Buffer;
  };
}

export default class Contextualizer {
  protected options: AnalOptions_Class = {
    combineEngines: true,
    store: false,
  };
  constructor(options?: AnalOptions_User) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }
  public async analyze(input: string | Buffer | Image): Context {
    const image = await this.inputToImage(input); // error when false input
    // let the extracting fun begin with an offical image object :]
  }

  private async inputToImage(input: string | Buffer | Image): Promise<Image> {
    if (input instanceof Image) return input;
    let img = await Image.create(input);
    if (img instanceof Image) {
      return img;
    } else {
      throw new Error("Failed to create image object");
    }
  }
}