export function getUserIP(req: Request) {
  const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || ''
  return ip
}
