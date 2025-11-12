# 

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.9.

## Development server

To start a local development server, run:

```bash
npm run serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

### Library Dependencies

This project uses a monorepo structure with multiple Angular libraries (`simulation`, `ui`, `rendering`, `fallback`, `config`, `a11y`). These libraries need to be built before the main application can import them.

**Automatic builds:** The `postinstall` script automatically builds all libraries after running `npm install`, ensuring the libraries are ready when you clone the repository.

**Manual builds:** If you modify any library code, rebuild all libraries with:

```bash
npm run build:libs
```

This ensures the `dist` folder contains the latest compiled library outputs that the main application depends on.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
