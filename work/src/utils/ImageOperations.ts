import { RGBA } from "sharp";
import Image from "./image";
import { RGBAColor, RGBColor } from "../types";
export default class ImageOperations {
  protected image: Image;
  constructor(image: Image) {
    this.image = image;
  }
  public colorDiff(
    color1: RGBColor | RGBAColor,
    color2: RGBColor | RGBAColor
  ): number {
    if ("a" in color1 && "a" in color2) {
      return (
        Math.abs(color1.r - color2.r) +
        Math.abs(color1.g - color2.g) +
        Math.abs(color1.b - color2.b) +
        Math.abs(color1.a - color2.a)
      );
    } else {
      return (
        Math.abs(color1.r - color2.r) +
        Math.abs(color1.g - color2.g) +
        Math.abs(color1.b - color2.b)
      );
    }
  }
}
