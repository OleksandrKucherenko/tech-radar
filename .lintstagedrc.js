export default {
  '*.{js,ts,json}': 'biome check --write --no-errors-on-unmatched --files-ignore-unknown=true',
  '*.html': 'prettier --write',
  'src/**/*.js': [() => 'bun test', () => 'bun run rebuild-radar'],
};
