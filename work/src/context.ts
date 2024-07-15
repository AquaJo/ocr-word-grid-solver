import Contextualizer from "./contextualizer";
import Buffer from "buffer";
/* export default class Context {
  imgPath: string;
  constructor(imgPath: string) {
    this.imgPath = imgPath;
  }
} */

let context: Context | undefined = Contextualizer.createContext(
  "image.png",
  true,
  true
); // true keeps images stored

if (context)
  // .....

  class Contextualizer {
    static createContext(
      path: string,
      combineEngines?: boolean,
      store?: boolean
    ): Context | undefined {
      // return blabla
    }
  }
interface Context {
  grid: string[][];
  image?: {
    original: Buffer;
    preprocessed: Buffer;
    processed: Buffer;
  };
}

// Context.grid, Context.image.original, Context.image.preprocessed, Context.image.processed
