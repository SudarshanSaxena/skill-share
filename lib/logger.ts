export function logger (req: Request,slug: string,message:any){
  if(!req.headers.get('x-api-call-stack-id')) {
    console.log(slug, JSON.stringify(message));
  }else{
    const traceId = req.headers.get('x-api-call-stack-id');
    console.log(`[${traceId}] ${slug}`, JSON.stringify(message));
  }
}