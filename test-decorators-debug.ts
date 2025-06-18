// Test simple para verificar decoradores
import 'reflect-metadata';

const CONTROLLER_METADATA = Symbol('ezql:controller');

// Simular el decorador Controller
function Controller(prefix: string) {
  return function<T extends new (...args: any[]) => any>(constructor: T) {
    const metadata = {
      prefix: prefix.startsWith('/') ? prefix : `/${prefix}`,
      middlewares: []
    };
    
    Reflect.defineMetadata(CONTROLLER_METADATA, metadata, constructor);
    console.log(`✅ Controller ${constructor.name} decorated with prefix: ${metadata.prefix}`);
    return constructor;
  };
}

// Test controller
@Controller('cats')
class TestController {
  test() {
    return 'test';
  }
}

// Verificar metadata
const metadata = Reflect.getMetadata(CONTROLLER_METADATA, TestController);
console.log('Metadata found:', metadata);

// Test con los controladores reales
import { CatsController } from './scr/web/controllers/example.controller';

const realMetadata = Reflect.getMetadata(CONTROLLER_METADATA, CatsController);
console.log('Real CatsController metadata:', realMetadata);
