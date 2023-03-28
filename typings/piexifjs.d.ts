declare module 'piexifjs' {
    export function load(dataUrl: string): any;
    export function dump(jpegData: any): string;
    export function insert(exifStr: string, dataUrl: string): string;
    export const ImageIFD: {
      Artist: number;
      Copyright: number;
      XPTitle: number;
      XPComment: number;
    };
  }