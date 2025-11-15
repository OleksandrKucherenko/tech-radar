export default {
  '*.{js,ts,json}': 'biome check --write --no-errors-on-unmatched --files-ignore-unknown=true',
  'src/**/*.js': [
    () => 'bun test',
    () => 'bun run rebuild-radar',
  ],
};
