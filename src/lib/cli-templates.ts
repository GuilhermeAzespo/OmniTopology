// CLI Templates per vendor for OmniTopology terminal emulation

export interface CliTemplate {
  welcome: string;
  prompt: string;
  commands: Record<string, (args: string[], nodeData: any) => string>;
}

const hostname = (data: any) => data?.hostname || "device";

export const CISCO_CLI: CliTemplate = {
  welcome: `
Cisco IOS Software, Version 15.7(3)M, RELEASE SOFTWARE (fc2)
Copyright (c) 1986-2019 by Cisco Systems, Inc.
Type 'help' for a list of available commands.
`,
  prompt: "#",
  commands: {
    help: () => `
Available commands:
  show version         - Display IOS version information
  show ip interface brief - Show interface summary
  show running-config  - Display running configuration
  show ip route        - Display routing table
  interface [name]     - Enter interface configuration
  hostname [name]      - Set device hostname
  clear                - Clear terminal
`,
    "show version": (_, d) => `
Cisco IOS Software, Version 15.7(3)M
Hostname: ${hostname(d)}
Uptime: 1 day, 2 hours, 30 minutes
Processor: Cisco RISC Processor rev 1
Memory: 512K bytes of non-volatile configuration memory
Flash: 256M bytes total`,
    "show ip interface brief": (_, d) => {
      const ifaces = d?.interfaces || [
        { name: "GigabitEthernet0/0", ip: "192.168.1.1", mask: "255.255.255.0", status: "up" },
        { name: "GigabitEthernet0/1", ip: "10.0.0.1", mask: "255.255.255.0", status: "up" },
      ];
      let out = "\nInterface              IP-Address      OK? Method Status    Protocol\n";
      ifaces.forEach((i: any) => {
        out += `${i.name.padEnd(22)} ${(i.ip || "unassigned").padEnd(16)} YES manual ${i.status.padEnd(10)} up\n`;
      });
      return out;
    },
    "show running-config": (_, d) => `
Building configuration...

Current configuration : 1024 bytes
!
version 15.7
service timestamps debug datetime msec
!
hostname ${hostname(d)}
!
interface GigabitEthernet0/0
 ip address ${d?.interfaces?.[0]?.ip || "192.168.1.1"} ${d?.interfaces?.[0]?.mask || "255.255.255.0"}
 no shutdown
!
interface GigabitEthernet0/1
 ip address ${d?.interfaces?.[1]?.ip || "10.0.0.1"} ${d?.interfaces?.[1]?.mask || "255.255.255.0"}
 no shutdown
!
end`,
    "show ip route": () => `
Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP

Gateway of last resort is not set

C    192.168.1.0/24 is directly connected, GigabitEthernet0/0
C    10.0.0.0/24 is directly connected, GigabitEthernet0/1
S    0.0.0.0/0 [1/0] via 192.168.1.254`,
  },
};

export const MIKROTIK_CLI: CliTemplate = {
  welcome: `
  MMM      MMM       KKK                    TTTTTTTTTTT      KKK
  MMMM    MMMM       KKK                        TTT          KKK
  MMM MMMM MMM  IIIII KKK  KKK  RRRRRR    OOOOOO TTT  IIIII KKK  KKK
  MMM  MM  MMM  IIIII KKKKK     RRR  RRR OOO  OOO TTT  IIIII KKKKK
  MMM      MMM  IIIII KKK KKK   RRRRRR   OOO  OOO TTT  IIIII KKK KKK
  MMM      MMM  IIIII KKK  KKK  RRR  RRR  OOOOOO  TTT  IIIII KKK  KKK

  MikroTik RouterOS 7.14 (c) 2024

  Type '?' for help
`,
  prompt: "> ",
  commands: {
    "?": () => `
General commands:
  /ip address print        - List IP addresses
  /ip route print          - Show routing table
  /interface print         - List interfaces
  /system identity print   - Show hostname
  /system resource print   - Show system resources
  /ip firewall filter print - Show firewall rules
  /ip dns print            - Show DNS settings
`,
    "/ip address print": (_, d) => {
      const ifaces = d?.interfaces || [
        { name: "ether1", ip: "192.168.1.1/24" },
        { name: "ether2", ip: "10.0.0.1/24" },
      ];
      let out = "Flags: X - disabled, I - invalid, D - dynamic\n";
      out += " #   ADDRESS            NETWORK         INTERFACE\n";
      ifaces.forEach((i: any, idx: number) => {
        out += ` ${idx}   ${(i.ip || "").padEnd(18)} ${(i.network || "").padEnd(15)} ${i.name}\n`;
      });
      return out;
    },
    "/interface print": (_, d) => {
      const ifaces = d?.interfaces || [
        { name: "ether1", type: "ether", running: true },
        { name: "ether2", type: "ether", running: true },
      ];
      let out = "Flags: D - dynamic, X - disabled, R - running, S - slave\n";
      out += " #  R  NAME             TYPE       ACTUAL-MTU L2MTU MAX-L2MTU\n";
      ifaces.forEach((i: any, idx: number) => {
        out += ` ${idx}  R  ${i.name.padEnd(15)} ${(i.type || "ether").padEnd(10)} 1500       1598  65535\n`;
      });
      return out;
    },
    "/system identity print": (_, d) => `   name: ${hostname(d)}`,
    "/system resource print": (_, d) => `
           uptime: 1d2h30m
      free-memory: 512.0MiB
     total-memory: 1024.0MiB
              cpu: ARM
        cpu-count: 4
         cpu-load: 2%
 free-hdd-space: 8.0GiB
total-hdd-space: 16.0GiB
  board-name: ${d?.model || "RB4011iGS+5HacQ2HnD"}
        version: 7.14`,
    "/ip route print": () => `
Flags: X - disabled, A - active, D - dynamic, C - connect, S - static, r - rip, b - bgp, o - ospf

 #      DST-ADDRESS        PREF-SRC          GATEWAY            DISTANCE
 0 A S  0.0.0.0/0                            192.168.1.254      1
 1 ADC  192.168.1.0/24     192.168.1.1       ether1             0
 2 ADC  10.0.0.0/24        10.0.0.1          ether2             0`,
    "/ip firewall filter print": () => `
Flags: X - disabled, I - invalid, D - dynamic
 #  CHAIN           ACTION    PROTO SRC-ADDRESS    DST-ADDRESS
 0  input           accept    tcp                               (established,related)
 1  forward         fasttrack                                   (established,related)
 2  input           drop`,
    "/ip dns print": () => `
        servers: 8.8.8.8,1.1.1.1
  dynamic-servers:
   use-doh-server:
        verify-doh-cert: no
        allow-remote-requests: yes`,
  },
};

export const PFSENSE_CLI: CliTemplate = {
  welcome: `
pfSense CE 2.7.2
Netgate Device ID: abc123

*** Welcome to pfSense CLI ***
  0) Logout (SSH only)
  1) Assign Interfaces
  2) Set interface(s) IP address
  3) Reset webConfigurator password
  4) Reset to factory defaults
  5) Reboot system
  6) Halt system
  7) Ping host
  8) Shell
  9) pfTop
  10) Filter Logs
  11) Restart webConfigurator
  12) PHP shell + pfSense tools
  16) Restart PHP-FPM

Enter an option:
`,
  prompt: "$ ",
  commands: {
    "8": () => "Entering shell...\n[2.7.2-RELEASE][root@pfSense]/: ",
    ifconfig: (_, d) => `
em0: flags=8843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST> metric 0 mtu 1500
	inet ${d?.interfaces?.[0]?.ip || "192.168.1.1"} netmask 0xffffff00 broadcast 192.168.1.255
em1: flags=8843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST> metric 0 mtu 1500
	inet ${d?.interfaces?.[1]?.ip || "10.0.0.1"} netmask 0xffffff00 broadcast 10.0.0.255`,
    "netstat -rn": () => `
Routing tables

Internet:
Destination        Gateway            Flags   Netif Expire
default            192.168.1.254      UGS       em0
192.168.1.0/24     link#1             U         em0
10.0.0.0/24        link#2             U         em1`,
    help: () => `
pfSense Shell Commands:
  ifconfig          - Show network interfaces
  netstat -rn       - Show routing table
  pfctl -sa         - Show all pf rules
  top               - Process monitor
  clear             - Clear screen`,
  },
};

export const LINUX_CLI: CliTemplate = {
  welcome: `
Ubuntu Server 22.04.3 LTS

Welcome to OmniTopology Linux Node!
Type 'help' for available commands.
`,
  prompt: "$ ",
  commands: {
    help: () => `
Available simulation commands:
  ip addr show         - Show IP addresses
  ip route show        - Show routing table
  ifconfig             - Legacy interface info
  ss -tuln             - Show listening ports
  ping [host]          - Simulate ping
  df -h                - Disk usage
  free -h              - Memory usage
  uname -a             - Kernel info`,
    "ip addr show": (_, d) => {
      const ifaces = d?.interfaces || [
        { name: "eth0", ip: "192.168.1.10/24", mac: "02:42:ac:11:00:02" },
      ];
      let out = "";
      ifaces.forEach((i: any, idx: number) => {
        out += `${idx + 1}: ${i.name}: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n`;
        out += `    link/ether ${i.mac || "02:42:ac:11:00:0" + (idx + 2)} brd ff:ff:ff:ff:ff:ff\n`;
        out += `    inet ${i.ip || "192.168.1.10/24"} brd ${i.broadcast || "192.168.1.255"} scope global dynamic ${i.name}\n\n`;
      });
      return out;
    },
    "ip route show": () => `
default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.10 metric 100
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.10`,
    "uname -a": () =>
      `Linux server 5.15.0-88-generic #98-Ubuntu SMP Mon Oct 2 15:18:56 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux`,
    "free -h": () => `
               total        used        free      shared  buff/cache   available
Mem:           15Gi        2.5Gi        10Gi       234Mi        2.4Gi        12Gi
Swap:         2.0Gi          0B        2.0Gi`,
    "df -h": () => `
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   12G   36G  25% /
tmpfs           7.7G     0  7.7G   0% /dev/shm`,
  },
};

export const CLI_VENDORS: Record<string, CliTemplate> = {
  cisco: CISCO_CLI,
  mikrotik: MIKROTIK_CLI,
  pfsense: PFSENSE_CLI,
  opnsense: PFSENSE_CLI,
  linux: LINUX_CLI,
  windows: LINUX_CLI, // fallback
  generic: LINUX_CLI,
  aruba: CISCO_CLI, // fallback
  ubiquiti: LINUX_CLI, // fallback
  fortigate: CISCO_CLI, // fallback
};
