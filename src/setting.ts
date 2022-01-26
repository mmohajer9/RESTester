import { Setting } from './interfaces';

export class Configuration implements Setting {
  constructor(
    public sourcePath = './openapi.json',
    public graphPath = './odg.json',
    public responseDictPath = './rd.json',
    public outputDir = './'
  ) {}
}
