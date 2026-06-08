// Device vendor definitions for OmniTopology
export type DeviceVendor =
  | "cisco"
  | "mikrotik"
  | "pfsense"
  | "opnsense"
  | "fortigate"
  | "ubiquiti"
  | "hp-aruba"
  | "intelbras"
  | "linux"
  | "windows-server"
  | "generic";

export type DeviceCategory =
  | "router"
  | "switch"
  | "firewall"
  | "access-point"
  | "server"
  | "cloud"
  | "link";

export interface DeviceDefinition {
  id: string;
  label: string;
  vendor: DeviceVendor;
  category: DeviceCategory;
  models: string[];
  color: string;
  icon: string;
  cliVendor: string;
}

export const DEVICE_LIBRARY: DeviceDefinition[] = [
  // === ROUTERS ===
  {
    id: "cisco-router",
    label: "Cisco Router",
    vendor: "cisco",
    category: "router",
    models: ["ISR 4321", "ISR 4331", "ISR 4351", "ASR 1001", "ASR 1002"],
    color: "#1d4ed8",
    icon: "router",
    cliVendor: "cisco",
  },
  {
    id: "mikrotik-router",
    label: "Mikrotik Router",
    vendor: "mikrotik",
    category: "router",
    models: ["hEX S", "hEX", "RB4011", "CCR2004", "CCR1036", "CHR"],
    color: "#ef4444",
    icon: "router",
    cliVendor: "mikrotik",
  },
  // === SWITCHES ===
  {
    id: "cisco-switch",
    label: "Cisco Switch",
    vendor: "cisco",
    category: "switch",
    models: ["Catalyst 2960", "Catalyst 3750", "Catalyst 9200", "Catalyst 9300"],
    color: "#1d4ed8",
    icon: "switch",
    cliVendor: "cisco",
  },
  {
    id: "mikrotik-switch",
    label: "Mikrotik Switch",
    vendor: "mikrotik",
    category: "switch",
    models: ["CRS317", "CRS309", "CRS326", "CSS610", "CSS326"],
    color: "#ef4444",
    icon: "switch",
    cliVendor: "mikrotik",
  },
  {
    id: "hp-aruba-switch",
    label: "HP/Aruba Switch",
    vendor: "hp-aruba",
    category: "switch",
    models: ["Aruba 2930F", "Aruba 6300M", "HP 1920S", "HP 1930"],
    color: "#7c3aed",
    icon: "switch",
    cliVendor: "aruba",
  },
  {
    id: "intelbras-switch",
    label: "Intelbras Switch",
    vendor: "intelbras",
    category: "switch",
    models: ["SG 2404 MR", "SG 1000 MR", "SG 2620 QR+"],
    color: "#059669",
    icon: "switch",
    cliVendor: "generic",
  },
  // === FIREWALLS ===
  {
    id: "pfsense",
    label: "pfSense",
    vendor: "pfsense",
    category: "firewall",
    models: ["pfSense CE", "pfSense Plus", "Netgate 6100", "Netgate 8200"],
    color: "#d97706",
    icon: "firewall",
    cliVendor: "pfsense",
  },
  {
    id: "opnsense",
    label: "OPNsense",
    vendor: "opnsense",
    category: "firewall",
    models: ["OPNsense 23.x", "OPNsense 24.x", "Deciso DEC750"],
    color: "#ea580c",
    icon: "firewall",
    cliVendor: "opnsense",
  },
  {
    id: "fortigate",
    label: "FortiGate",
    vendor: "fortigate",
    category: "firewall",
    models: ["FortiGate 40F", "FortiGate 60F", "FortiGate 80F", "FortiGate 100F"],
    color: "#dc2626",
    icon: "firewall",
    cliVendor: "fortigate",
  },
  {
    id: "mikrotik-firewall",
    label: "Mikrotik Firewall",
    vendor: "mikrotik",
    category: "firewall",
    models: ["CHR", "RB4011", "CCR2004"],
    color: "#ef4444",
    icon: "firewall",
    cliVendor: "mikrotik",
  },
  // === ACCESS POINTS ===
  {
    id: "ubiquiti-ap",
    label: "Ubiquiti UniFi AP",
    vendor: "ubiquiti",
    category: "access-point",
    models: ["U6 Lite", "U6 Pro", "U6 Long-Range", "UAP-AC-Pro"],
    color: "#0284c7",
    icon: "access-point",
    cliVendor: "ubiquiti",
  },
  {
    id: "mikrotik-ap",
    label: "Mikrotik AP",
    vendor: "mikrotik",
    category: "access-point",
    models: ["wAP ac", "cAP ac", "hAP ac3", "Audience"],
    color: "#ef4444",
    icon: "access-point",
    cliVendor: "mikrotik",
  },
  // === SERVERS ===
  {
    id: "linux-server",
    label: "Linux Server",
    vendor: "linux",
    category: "server",
    models: ["Ubuntu Server", "Debian", "CentOS", "Rocky Linux", "Alpine"],
    color: "#f59e0b",
    icon: "server",
    cliVendor: "linux",
  },
  {
    id: "windows-server",
    label: "Windows Server",
    vendor: "windows-server",
    category: "server",
    models: ["Windows Server 2019", "Windows Server 2022"],
    color: "#3b82f6",
    icon: "server",
    cliVendor: "windows",
  },
  // === CLOUD / INTERNET ===
  {
    id: "cloud",
    label: "Cloud / Internet",
    vendor: "generic",
    category: "cloud",
    models: ["Internet", "AWS", "Azure", "GCP", "ISP"],
    color: "#6366f1",
    icon: "cloud",
    cliVendor: "generic",
  },
];

export const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  router: "Roteadores",
  switch: "Switches",
  firewall: "Firewalls",
  "access-point": "Access Points",
  server: "Servidores",
  cloud: "Cloud / Internet",
  link: "Links",
};

export const LINK_TYPES = [
  { id: "ethernet", label: "Ethernet", color: "#06b6d4", style: "solid" },
  { id: "fiber", label: "Fibra Óptica", color: "#8b5cf6", style: "solid" },
  { id: "wifi", label: "Wi-Fi", color: "#f59e0b", style: "dashed" },
  { id: "wan", label: "WAN / Internet", color: "#ef4444", style: "dashed" },
  { id: "vpn", label: "VPN Tunnel", color: "#10b981", style: "dotted" },
];
