import Image from "./utils/image";

interface DetailedLetterBufferGrid {
  grid: Buffer[][];
  xCrops: number[];
  yCrops: number[];
}
interface CommunicatorLetterBufferGrid extends DetailedLetterBufferGrid {
  visualizedCropGrid: Buffer;
  originalImage: Buffer;
  preprocessedImage: Buffer;
  processedImage: Buffer;
}

class ImageExtractor {
  public static async seperateLetters(
    image: Image
  ): Promise<CommunicatorLetterBufferGrid> {}
}

interface LetterExtractorOptions_User {
  xStreakThickness?: number; // in percentage to the image width
  yStreakThickness?: number; // in percentage to the image height
  minBackgroundThreshold?: number; // as min rgb-mean-value used to determine if a pixel is background or belongs to a letter / line
}
interface LetterExtractorOptions_Class {
  xStreakThickness: number;
  yStreakThickness: number;
  minBackgroundThreshold: number;
}

class LetterExtractor {
  protected options: LetterExtractorOptions_Class = {
    xStreakThickness: 1 / 15,
    yStreakThickness: 1 / 24,
    minBackgroundThreshold: 130,
  };
  constructor() {}
}
