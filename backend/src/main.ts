import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import * as express from 'express';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule)

	app.setGlobalPrefix('api')
	
	app.use(express.json({ limit: '10mb' }));
	app.use(express.urlencoded({ limit: '10mb', extended: true }));

	app.useStaticAssets(join(__dirname, '..', 'uploads'), {
		prefix: '/uploads/',
	})

	await app.listen(3000)
}

bootstrap()
