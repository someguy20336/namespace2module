If you have a bunch of typescript files using `namespace`, this should convert them to using `import`s.

## Usage
This isn't deployed through `npm` or anything just yet, so you have to run it manually.

- Download a copy of the repo
- run `npx tsc --project tsconfig.json`
- run `node ./dist/cli.js <path to your tsconfig.json> [-v to view]`
  - example: `node ./dist/cli.js C:\path\to\your\file\tsconfig.json`
  - example view only: `node ./dist/cli.js C:\path\to\your\file\tsconfig.json -v`