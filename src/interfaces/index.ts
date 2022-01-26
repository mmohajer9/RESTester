export interface Setting {
  outputDir: string;
  sourcePath: string;
  graphPath: string;
  responseDictPath: string;
}

export interface Generator {}

export interface Application {
  setting: Setting;
  init: () => void;
  print: () => void;
  generate: (num: number) => void;
  plot: () => void;
}
