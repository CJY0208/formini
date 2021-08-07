import { version } from './package.json'

export default {
  mode: 'site',
  title: `Formini`,
  outputPath: 'build',
  navs: [null, { title: `v${version}` }],
}
