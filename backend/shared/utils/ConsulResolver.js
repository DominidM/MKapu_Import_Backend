const Consul = require("consul");
const CONSUL_HOST = process.env.CONSUL_HOST || "localhost";
const consul = new Consul({ host: CONSUL_HOST, port: 8500, promisify: true });
async function resolveService(serviceName) {
  try {
    const result = await consul.health.service(serviceName, { passing: true });
    const healthyNodes = result.filter(node => 
        node.Checks.every(check => check.Status === 'passing')
    );

    if (healthyNodes.length === 0) {
      console.warn(`[ConsulResolver] No healthy instances found for ${serviceName}. Falling back to default URL...`);
      const defaultPort = {
        'auth-service': 3001,
      }[serviceName];
      
      if (!defaultPort) throw new Error(`Unknown service name: ${serviceName}`);
      return `http://localhost:${defaultPort}`;
    }

    const randomIndex = Math.floor(Math.random() * healthyNodes.length);
    const instance = healthyNodes[randomIndex].Service;
    return `http://${instance.Address}:${instance.Port}`;

  } catch (error) {
    console.error(`[ConsulResolver] Error resolving ${serviceName}: ${error.message}. Attempting fallback.`);
     const defaultPort = {
        'auth-service': 3001,
      }[serviceName];
      if (!defaultPort) throw new Error(`Unknown service name: ${serviceName}`);
      return `http://localhost:${defaultPort}`;
  }
}
module.exports = { resolveService };