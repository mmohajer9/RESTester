import { Application, Setting } from './interfaces';

class RESTester implements Application {
  constructor(public setting: Setting) {}

  init() {}
  generate(num: number) {}
  plot() {}
  print() {}
}

export default RESTester;
