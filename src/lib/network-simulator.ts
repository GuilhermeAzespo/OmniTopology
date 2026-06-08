import { Node, Edge } from "reactflow";

// Utilitário para validar endereços IP e sub-redes usando CIDR
export function ipToLong(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function cidrToSubnetInfo(cidr: string) {
  const [ip, prefixLenStr] = cidr.split("/");
  if (!ip || !prefixLenStr) return null;
  const prefixLen = parseInt(prefixLenStr, 10);
  const mask = ~((1 << (32 - prefixLen)) - 1) >>> 0;
  const network = ipToLong(ip) & mask;
  return { ip, prefixLen, mask, network };
}

// Simula a obtenção de IP via DHCP em uma sub-rede
export function simulateDHCP(node: Node, nodes: Node[], edges: Edge[], vlanPath: Set<string> = new Set()) {
  // Procura servidores DHCP conectados ao nó
  // Isso requer travessia do grafo
  let foundIp: string | null = null;
  let visited = new Set<string>();
  
  function dfs(currentId: string, currentVlan: string) {
    if (foundIp || visited.has(currentId)) return;
    visited.add(currentId);
    
    const current = nodes.find(n => n.id === currentId);
    if (!current) return;
    
    // É um servidor DHCP?
    if (current.data.dhcpServer && current.data.dhcpNetwork) {
      // Simula entregar um IP da rede
      const netInfo = cidrToSubnetInfo(current.data.dhcpNetwork);
      if (netInfo) {
        // Gera um IP falso baseado no range, ex: final .100 + random
        const baseIp = current.data.dhcpNetwork.split(".")[0] + "." + current.data.dhcpNetwork.split(".")[1] + "." + current.data.dhcpNetwork.split(".")[2];
        foundIp = `${baseIp}.${Math.floor(Math.random() * 100 + 50)}/${netInfo.prefixLen}`;
        return;
      }
    }
    
    // Descobre vizinhos
    const connectedEdges = edges.filter(e => e.source === currentId || e.target === currentId);
    for (const edge of connectedEdges) {
      const isSource = edge.source === currentId;
      const nextId = isSource ? edge.target : edge.source;
      const nextNode = nodes.find(n => n.id === nextId);
      if (!nextNode) continue;
      
      const myPort = isSource ? edge.data?.sourcePort : edge.data?.targetPort;
      const nextPort = isSource ? edge.data?.targetPort : edge.data?.sourcePort;
      
      let nextVlan = currentVlan;
      
      // Regras de Switch (simplificadas)
      if (current.data.category === "switch") {
        const portConfig = current.data.interfaces?.find((i: any) => i.name === myPort);
        if (portConfig) {
          if (portConfig.mode === "access") {
            if (currentVlan !== "1" && currentVlan !== portConfig.vlan) continue; // Bloqueia
            nextVlan = portConfig.vlan;
          } else if (portConfig.mode === "trunk") {
            // Trunk permite tudo ou vlans especificadas, vamos assumir tudo
          }
        }
      }
      
      if (nextNode.data.category === "switch") {
        const portConfig = nextNode.data.interfaces?.find((i: any) => i.name === nextPort);
        if (portConfig) {
          if (portConfig.mode === "access") {
            if (nextVlan !== "1" && nextVlan !== portConfig.vlan) continue;
            nextVlan = portConfig.vlan;
          }
        }
      }
      
      dfs(nextId, nextVlan);
    }
  }
  
  dfs(node.id, "1");
  return foundIp;
}

export function simulatePing(sourceId: string, targetId: string, nodes: Node[], edges: Edge[]) {
  const source = nodes.find(n => n.id === sourceId);
  const target = nodes.find(n => n.id === targetId);
  
  if (!source || !target) return { success: false, log: "Nó de origem ou destino não encontrado." };
  
  // Acha IP da origem
  let sourceIp = source.data.interfaces?.find((i: any) => i.ip)?.ip;
  if (!sourceIp) {
    sourceIp = simulateDHCP(source, nodes, edges);
  }
  
  // Acha IP do destino
  let targetIp = target.data.interfaces?.find((i: any) => i.ip)?.ip;
  if (!targetIp) {
    targetIp = simulateDHCP(target, nodes, edges);
  }
  
  if (!sourceIp) return { success: false, log: `Origem (${source.data.label}) não possui IP e não encontrou Servidor DHCP.` };
  if (!targetIp) return { success: false, log: `Destino (${target.data.label}) não possui IP e não encontrou Servidor DHCP.` };
  
  // Checa sub-rede
  const srcNet = cidrToSubnetInfo(sourceIp);
  const dstNet = cidrToSubnetInfo(targetIp);
  
  if (!srcNet || !dstNet) return { success: false, log: "Configuração de IP inválida." };
  
  const isSameNetwork = srcNet.network === dstNet.network && srcNet.mask === dstNet.mask;
  
  // Se for a mesma rede, tenta achar o caminho físico checando VLANs
  let pathFound = false;
  let visited = new Set<string>();
  let blockReason = "";
  
  function dfsPath(currentId: string, currentVlan: string) {
    if (pathFound) return;
    if (currentId === targetId) { pathFound = true; return; }
    visited.add(currentId);
    
    const current = nodes.find(n => n.id === currentId);
    const connectedEdges = edges.filter(e => e.source === currentId || e.target === currentId);
    
    for (const edge of connectedEdges) {
      const isSource = edge.source === currentId;
      const nextId = isSource ? edge.target : edge.source;
      const nextNode = nodes.find(n => n.id === nextId);
      
      if (visited.has(nextId) || !nextNode) continue;
      
      const myPort = isSource ? edge.data?.sourcePort : edge.data?.targetPort;
      const nextPort = isSource ? edge.data?.targetPort : edge.data?.sourcePort;
      
      let nextVlan = currentVlan;
      
      if (current?.data.category === "switch") {
        const pConf = current.data.interfaces?.find((i: any) => i.name === myPort);
        if (pConf && pConf.mode === "access") {
          if (currentVlan !== "1" && currentVlan !== pConf.vlan) {
            blockReason = `Tráfego bloqueado: A porta ${myPort} do Switch ${current.data.label} está na VLAN ${pConf.vlan}, pacote é VLAN ${currentVlan}`;
            continue;
          }
          nextVlan = pConf.vlan;
        }
      }
      
      if (nextNode.data.category === "switch") {
        const pConf = nextNode.data.interfaces?.find((i: any) => i.name === nextPort);
        if (pConf && pConf.mode === "access") {
          if (nextVlan !== "1" && nextVlan !== pConf.vlan) {
            blockReason = `Tráfego bloqueado: A porta ${nextPort} do Switch ${nextNode.data.label} exige VLAN ${pConf.vlan}, pacote é VLAN ${nextVlan}`;
            continue;
          }
          nextVlan = pConf.vlan;
        }
      }
      
      dfsPath(nextId, nextVlan);
    }
  }
  
  dfsPath(sourceId, "1");
  
  let log = `Ping de ${source.data.label} (${sourceIp.split('/')[0]}) para ${target.data.label} (${targetIp.split('/')[0]})\n`;
  if (isSameNetwork) {
    if (pathFound) {
      log += `\nResposta de ${targetIp.split('/')[0]}: bytes=32 tempo=2ms TTL=64\n`;
      log += `Resposta de ${targetIp.split('/')[0]}: bytes=32 tempo=3ms TTL=64\n`;
      log += `\nSucesso: Conexão física e VLANs validadas.`;
      return { success: true, log };
    } else {
      log += `\nFalha: O host de destino está inalcançável fisicamente ou devido a VLANs.\nMotivo: ${blockReason || "Cabo não conectado"}`;
      return { success: false, log };
    }
  } else {
    // Roteamento
    // Vamos assumir que se não for a mesma rede e não tiver roteador, falha
    // Em uma versão simples, apenas relatamos:
    log += `\nFalha: Roteamento não simulado nesta versão (IPs em sub-redes diferentes).`;
    return { success: false, log };
  }
}
