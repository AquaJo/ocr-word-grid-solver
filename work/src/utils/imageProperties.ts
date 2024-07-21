import { RGBAColor, RGBColor } from "../types";
import Image from "./image";
export default class ImageProperties {
  protected image: Image;
  protected bgColor: RGBColor | RGBAColor | null | undefined;
  constructor(image: Image) {
    this.image = image;
  }
  public getBackgroundColor(tolerance?: number): RGBColor | RGBAColor | null {
    if (this.bgColor) {
      return this.bgColor;
    }
    if (!tolerance) tolerance = 5;
    let pixelArray = this.image.pixelArray;
    // Array zur Speicherung der Farben und ihrer Zähler
    const colorCount = [];

    // Durchlaufe alle Pixel im Array
    for (let x = 0; x < pixelArray.length; x++) {
      for (let y = 0; y < pixelArray[x].length; y++) {
        const pixel = pixelArray[x][y]; // Hole den aktuellen Pixel
        let found = false; // Flag, um zu überprüfen, ob eine ähnliche Farbe gefunden wurde

        // Überprüfe, ob eine ähnliche Farbe bereits im Array existiert
        for (let i = 0; i < colorCount.length; i++) {
          const existingColor = colorCount[i].color;
          if (
            this.image.operations.colorDiff(pixel, existingColor) <= tolerance
          ) {
            // Überprüfe die Farbdifferenz
            colorCount[i].count++; // Erhöhe den Zähler der ähnlichen Farbe
            found = true; // Setze das Flag auf true
            break; // Beende die Schleife, da eine ähnliche Farbe gefunden wurde
          }
        }

        // Wenn keine ähnliche Farbe gefunden wurde, füge die neue Farbe zum Array hinzu
        if (!found) {
          colorCount.push({ color: pixel, count: 1 });
        }
      }
    }

    // Finde die Farbe mit den meisten Vorkommen
    let maxCount = 0;
    let backgroundColor = null;
    for (let i = 0; i < colorCount.length; i++) {
      if (colorCount[i].count > maxCount) {
        // Überprüfe, ob der aktuelle Zähler größer als der maximale Zähler ist
        maxCount = colorCount[i].count; // Aktualisiere den maximalen Zähler
        backgroundColor = colorCount[i].color; // Aktualisiere die Hintergrundfarbe
      }
    }

    // Rückgabe der Hintergrundfarbe
    //console.log(colorCount);
    this.bgColor = backgroundColor;
    return backgroundColor;
  }
}
