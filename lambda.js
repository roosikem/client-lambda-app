import { existsSync } from 'fs';
import { join } from 'path';
import { CommonEngine } from '@angular/ssr';
import { AppServerModule } from './src/main.server';

const distFolder = join(process.cwd(), 'dist/c/browser');
const indexHtml = existsSync(join(distFolder, 'index.original.html'))
  ? join(distFolder, 'index.original.html')
  : join(distFolder, 'index.html');

const commonEngine = new CommonEngine();

export async function lambdaHandler(event, context) {
  try {
    const { headers } = event;
    const protocol = headers['X-Forwarded-Proto'] || 'http';
    const originalUrl = event.path;
    const baseUrl = ''; // Set your base URL here if needed

    const html = await commonEngine.render({
      bootstrap: AppServerModule,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.Host}${originalUrl}`,
      publicPath: distFolder,
      providers: [
        { provide: 'serverUrl', useValue: `${protocol}://${headers.Host}` },
      ],
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: html,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}