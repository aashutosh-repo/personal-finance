import { ApplicationConfig, bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
// import bootstrap from './main.server.js';

// const bootstrap = () => bootstrapApplication(AppComponent, config);

// export default bootstrap;

// export default function (context: BootstrapContext) {
//   return bootstrapApplication(AppComponent, {
//     ...(config as ApplicationConfig),
//     context, // ✅ explicitly outside the ApplicationConfig
//   } as any); // 👈 This suppresses TS warning — safe for SSR bootstrapping
// }


export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(AppComponent, config, context);
}