import { OpenApiValidator } from 'express-openapi-validator/dist/openapi.validator'
import path from 'path'

console.log(path.join(process.cwd(), 'spec.yaml'))
const validator = new OpenApiValidator({
  apiSpec: path.join(process.cwd(), 'spec.yaml'),
})

export default validator